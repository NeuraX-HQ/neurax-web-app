import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
// @ts-ignore
import type { Schema } from '../data/resource';

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const IS_DEBUG = process.env.DEBUG === "true" || process.env.NODE_ENV === "development";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const debug = (message: string, data?: any) => {
  if (IS_DEBUG) console.log(`[process-nutrition] ${message}`, data || "");
};

let cachedTableName: string | null = null;

async function discoverTableName(): Promise<string> {
  if (cachedTableName) return cachedTableName;
  if (process.env.FOOD_TABLE_NAME) {
    cachedTableName = process.env.FOOD_TABLE_NAME;
    return cachedTableName;
  }
  const result = await client.send(new ListTablesCommand({}));
  const foodTable = result.TableNames?.find((name: string) => name.startsWith('Food-'));
  if (!foodTable) throw new Error('Food table not found');
  cachedTableName = foodTable;
  return cachedTableName;
}

/**
 * Chuẩn hóa chuỗi: xóa dấu, viết thường, trim
 */
function normalize(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Tìm kiếm món ăn trong DB sử dụng Query (GSI) và Scan (Aliases)
 */
async function findFoodInDB(query: string, tableName: string): Promise<any | null> {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  debug(`Searching for: "${q}" (diacritic-sensitive)`);

  // 1. TÌM CHÍNH XÁC (Có dấu) - Ưu tiên GSI
  // Chúng ta sẽ thử tìm chính xác với query gốc (có thể có dấu)
  const queryVi = await docClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: 'name_vi',
    KeyConditionExpression: 'name_vi = :name',
    ExpressionAttributeValues: { ':name': query }
  }));
  if (queryVi.Items?.length) return queryVi.Items[0];

  // 2. TÌM CHỮ CHỨA CỤM TỪ (Có dấu)
  // Ví dụ: tìm "bò" sẽ ra "Thịt bò", nhưng không ra "Bơ"
  const scanVi = await docClient.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: 'contains(name_vi, :q) OR contains(name_en, :q)',
    ExpressionAttributeValues: { ':q': query }
  }));

  if (scanVi.Items?.length) {
    // Nếu có nhiều kết quả, ưu tiên món có tên ngắn nhất (gần với query nhất)
    // Điều này giúp "Bò" ưu tiên chọn "Thịt bò" thay vì "Bò kho" nếu query là "Bò"
    return scanVi.Items.sort((a, b) => a.name_vi.length - b.name_vi.length)[0];
  }

  // 3. TÌM TRONG ALIASES (Có dấu)
  const scanAlias = await docClient.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: 'contains(aliases_vi, :q)',
    ExpressionAttributeValues: { ':q': query }
  }));
  if (scanAlias.Items?.length) return scanAlias.Items[0];

  // 4. PHƯƠNG ÁN CUỐI: Tìm không dấu (Chỉ khi query gốc không ra kết quả)
  // Chỉ dùng khi input của user có thể không có dấu
  const normalizedQuery = normalize(query);
  if (normalizedQuery !== q) { // Nếu query gốc có dấu, chúng ta đã thử ở trên rồi
      // Thực hiện scan mờ nếu thực sự cần thiết, nhưng nên hạn chế để tránh "bò" nhầm "bơ"
      debug(`Fallback to normalized search for: ${normalizedQuery}`);
      // Ở đây ta có thể implement thêm nếu muốn hỗ trợ tìm không dấu hoàn toàn
  }

  return null;
}

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
  const tableName = await discoverTableName();

  try {
    const data = JSON.parse(payload);
    
    // CASE 1: Tìm kiếm trực tiếp (AppSync search)
    if (data.action === 'directSearch') {
      const match = await findFoodInDB(data.query, tableName);
      if (match) {
        const serving = match.serving || {};
        const defaultG = serving.default_g || 100;
        return JSON.stringify({
          success: true,
          source: 'database',
          food: {
            ...match,
            calculated_nutrition: match.macros 
          }
        });
      }
      return JSON.stringify({ success: false, error: 'Not found in DB' });
    }

    // CASE 2: Xử lý dữ liệu từ AI (Voice/Image) - Recalculate
    const aiItems = data.items || [data];
    const processedItems = [];

    for (const aiItem of aiItems) {
      const ingredients = aiItem.ingredients || [];
      const processedIngredients = [];
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

      for (const ing of ingredients) {
        const dbMatch = await findFoodInDB(ing.name || ing.name_vi, tableName);
        if (dbMatch) {
          const nutrition = calculateNutrition(dbMatch, ing.weight_g || ing.estimated_g || 100);
          processedIngredients.push({
            ...ing,
            food_id: dbMatch.food_id,
            name_vi_db: dbMatch.name_vi,
            matched: true,
            source: 'database',
            ...nutrition
          });
          totalCalories += nutrition.calories;
          totalProtein += nutrition.protein_g;
          totalCarbs += nutrition.carbs_g;
          totalFat += nutrition.fat_g;
        } else {
          processedIngredients.push({
            ...ing,
            matched: false,
            source: 'ai_estimated'
          });
          totalCalories += (ing.calories || 0);
          totalProtein += (ing.protein_g || 0);
          totalCarbs += (ing.carbs_g || 0);
          totalFat += (ing.fat_g || 0);
        }
      }

      processedItems.push({
        ...aiItem,
        total_calories: Math.round(totalCalories * 10) / 10,
        total_protein_g: Math.round(totalProtein * 10) / 10,
        total_carbs_g: Math.round(totalCarbs * 10) / 10,
        total_fat_g: Math.round(totalFat * 10) / 10,
        ingredients: processedIngredients,
        db_verified: processedIngredients.some(i => i.matched)
      });
    }

    return JSON.stringify({ success: true, items: processedItems });

  } catch (error) {
    debug('Error:', error);
    return JSON.stringify({ success: false, error: String(error) });
  }
};

