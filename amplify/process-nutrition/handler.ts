import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
// @ts-ignore
import type { Schema } from '../data/resource';

const REGION = process.env.AWS_REGION || 'ap-southeast-2';

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Cache tên bảng để tránh list tables nhiều lần
let cachedTableName: string | null = null;

/**
 * Tự động tìm tên bảng Food trên DynamoDB (pattern: Food-xxxxx-NONE)
 */
async function discoverTableName(): Promise<string> {
  if (cachedTableName) return cachedTableName;

  // Ưu tiên env variable nếu có
  if (process.env.FOOD_TABLE_NAME) {
    cachedTableName = process.env.FOOD_TABLE_NAME;
    return cachedTableName as string;
  }

  const result = await client.send(new ListTablesCommand({}));
  const foodTable = result.TableNames?.find((name: string) => name.startsWith('Food-'));
  if (!foodTable) throw new Error('Food table not found in DynamoDB');

  cachedTableName = foodTable;
  console.log(`Discovered Food table: ${cachedTableName}`);
  return cachedTableName as string;
}

// Cache danh sách Food để tránh scan DB nhiều lần trong cùng 1 invocation
let cachedFoods: any[] | null = null;

/**
 * Load toàn bộ bảng Food vào bộ nhớ Lambda (tối đa ~200 items, rất nhỏ)
 */
async function loadAllFoods(): Promise<any[]> {
  if (cachedFoods) return cachedFoods;

  const tableName = await discoverTableName();
  const allItems: any[] = [];
  let lastKey: any;

  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ...(lastKey && { ExclusiveStartKey: lastKey }),
    }));
    if (result.Items) allItems.push(...result.Items);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  cachedFoods = allItems;
  console.log(`Loaded ${allItems.length} foods from DB`);
  return allItems;
}

/**
 * Normalize text: lowercase, bỏ dấu tiếng Việt, trim
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Fuzzy search: Tìm item trong DB match với tên nguyên liệu từ AI
 * Ưu tiên: exact name_vi > aliases_vi contains > partial match name_vi > partial match aliases
 */
function findBestMatch(ingredientName: string, foods: any[]): any | null {
  const normalizedInput = normalize(ingredientName);
  
  // 1. Exact match name_vi
  let match = foods.find(f => normalize(f.name_vi) === normalizedInput);
  if (match) return match;

  // 2. Exact match trong aliases_vi
  match = foods.find(f => {
    const aliases = f.aliases_vi || [];
    return aliases.some((a: string) => normalize(a) === normalizedInput);
  });
  if (match) return match;

  // 3. name_vi chứa input HOẶC input chứa name_vi
  match = foods.find(f => {
    const nName = normalize(f.name_vi);
    return nName.includes(normalizedInput) || normalizedInput.includes(nName);
  });
  if (match) return match;

  // 4. Alias chứa input HOẶC input chứa alias
  match = foods.find(f => {
    const aliases = f.aliases_vi || [];
    return aliases.some((a: string) => {
      const nAlias = normalize(a);
      return nAlias.includes(normalizedInput) || normalizedInput.includes(nAlias);
    });
  });
  if (match) return match;

  // 5. Thử tìm bằng name_en / aliases_en
  match = foods.find(f => {
    const nEn = normalize(f.name_en || '');
    return nEn.includes(normalizedInput) || normalizedInput.includes(nEn);
  });
  if (match) return match;

  match = foods.find(f => {
    const aliases = f.aliases_en || [];
    return aliases.some((a: string) => {
      const nAlias = normalize(a);
      return nAlias.includes(normalizedInput) || normalizedInput.includes(nAlias);
    });
  });

  return match || null;
}

/**
 * Tính toán macros dựa trên DB data (per 100g) và lượng gram thực tế
 */
function calculateNutrition(dbFood: any, estimatedG: number) {
  const macros = dbFood.macros || {};
  const ratio = estimatedG / 100;

  return {
    calories: Math.round((macros.calories || 0) * ratio * 10) / 10,
    protein_g: Math.round((macros.protein_g || 0) * ratio * 10) / 10,
    carbs_g: Math.round((macros.carbs_g || 0) * ratio * 10) / 10,
    fat_g: Math.round((macros.fat_g || 0) * ratio * 10) / 10,
  };
}

// @ts-ignore
export const handler: Schema['processNutrition']['functionHandler'] = async (event: any) => {
  const { payload } = event.arguments;

  try {
    const data = JSON.parse(payload);
    
    // Load toàn bộ Food DB
    const allFoods = await loadAllFoods();

    // ==========================================
    // FAST PATH: Direct Search (Bỏ qua cấu hình AI)
    // Dùng cho tìm kiếm text đơn giản từ app
    // ==========================================
    if (data.action === 'directSearch' && data.query) {
      const match = findBestMatch(data.query, allFoods);
      
      if (match) {
        // Trả về item giả lập y hệt response sau khi map với ingredients
        const isMeal = match.type === 'meal';
        const serving = match.serving || {};
        const macros = match.macros || {};
        const defaultG = serving.default_g || 100;
        
        const pseudoIngredient = {
          name: match.name_vi,
          food_id: match.food_id,
          name_vi_db: match.name_vi,
          matched: true,
          source: 'database',
          estimated_g: defaultG,
          calories: macros.calories || 0,
          protein_g: macros.protein_g || 0,
          carbs_g: macros.carbs_g || 0,
          fat_g: macros.fat_g || 0,
        };

        return JSON.stringify({
          success: true,
          items: [{
            meal_name: match.name_vi,
            portion_size: `${defaultG} ${serving.unit || 'g'}`,
            total_calories: macros.calories || 0,
            total_protein_g: macros.protein_g || 0,
            total_carbs_g: macros.carbs_g || 0,
            total_fat_g: macros.fat_g || 0,
            ingredients: [pseudoIngredient],
            db_match_count: 1,
            ai_fallback_count: 0
          }]
        });
      }

      // Nếu không match, trả về false để Client gọi lại qua GEMINI
      return JSON.stringify({ success: false, error: 'Not found in DB direct search' });
    }

    // ==========================================
    // NORMAL PATH: Xử lý dữ liệu phức tạp từ AI
    // ==========================================
    const aiItems = data.items || [data]; // Hỗ trợ cả single item và array

    const processedItems = [];

    for (const aiItem of aiItems) {
      const ingredients = aiItem.ingredients || [];
      const processedIngredients = [];
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      for (const ing of ingredients) {
        const dbMatch = findBestMatch(ing.name, allFoods);
        
        if (dbMatch) {
          // ✅ Tìm thấy trong DB → Tính toán từ data chính xác
          const nutrition = calculateNutrition(dbMatch, ing.estimated_g);
          processedIngredients.push({
            name: ing.name,
            food_id: dbMatch.food_id,
            name_vi_db: dbMatch.name_vi,
            matched: true,
            source: 'database',
            estimated_g: ing.estimated_g,
            ...nutrition,
          });
          totalCalories += nutrition.calories;
          totalProtein += nutrition.protein_g;
          totalCarbs += nutrition.carbs_g;
          totalFat += nutrition.fat_g;
        } else {
          // ❌ Không có trong DB → Dùng data AI làm fallback
          const aiCalories = ing.calories || 0;
          const aiProtein = ing.protein_g || 0;
          const aiCarbs = ing.carbs_g || 0;
          const aiFat = ing.fat_g || 0;

          processedIngredients.push({
            name: ing.name,
            food_id: null,
            name_vi_db: null,
            matched: false,
            source: 'ai_estimated',
            estimated_g: ing.estimated_g,
            calories: aiCalories,
            protein_g: aiProtein,
            carbs_g: aiCarbs,
            fat_g: aiFat,
          });
          totalCalories += aiCalories;
          totalProtein += aiProtein;
          totalCarbs += aiCarbs;
          totalFat += aiFat;
        }
      }

      processedItems.push({
        meal_name: aiItem.meal_name,
        portion_size: aiItem.portion_size,
        total_calories: Math.round(totalCalories * 10) / 10,
        total_protein_g: Math.round(totalProtein * 10) / 10,
        total_carbs_g: Math.round(totalCarbs * 10) / 10,
        total_fat_g: Math.round(totalFat * 10) / 10,
        ingredients: processedIngredients,
        db_match_count: processedIngredients.filter(i => i.matched).length,
        ai_fallback_count: processedIngredients.filter(i => !i.matched).length,
      });
    }

    return JSON.stringify({
      success: true,
      items: processedItems,
    });

  } catch (error) {
    console.error('ProcessNutrition Error:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
