const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const TABLE_NAME = 'Food-m7szicsqofg6zmonnks6c3xame-NONE';
const REGION = 'ap-southeast-1';

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// ============================================
// 1. Clear toàn bộ dữ liệu cũ trong bảng
// ============================================
async function clearTable() {
  console.log('🗑️  Đang xóa toàn bộ dữ liệu cũ...');
  let totalDeleted = 0;
  let lastEvaluatedKey;

  do {
    const scanParams = {
      TableName: TABLE_NAME,
      ProjectionExpression: 'food_id',
      ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
    };

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const items = scanResult.Items || [];
    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    for (const item of items) {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { food_id: item.food_id },
      }));
      totalDeleted++;
    }
  } while (lastEvaluatedKey);

  console.log(`🗑️  Đã xóa ${totalDeleted} records cũ.`);
  return totalDeleted;
}

// ============================================
// 2. Đọc và gộp 3 file JSON
// ============================================
function loadAllFoods() {
  const dbDir = path.resolve(__dirname, 'db');

  // File 1: Ingredients (76 items)
  const ingredientsRaw = JSON.parse(fs.readFileSync(path.join(dbDir, 'ingredients_database.json'), 'utf8'));
  const ingredients = ingredientsRaw.items.map(item => {
    // Lọc bỏ storage_type, shelf_life_days, common_units (thuộc tính năng Fridge)
    const { storage_type, shelf_life_days, common_units, ...cleanItem } = item;
    return { ...cleanItem, type: 'ingredient' };
  });

  // File 2: Vietnamese Foods (48 items)
  const vnFoodsRaw = JSON.parse(fs.readFileSync(path.join(dbDir, 'vietnamese_food_database.json'), 'utf8'));
  const vnFoods = vnFoodsRaw.foods.map(item => ({ ...item, type: 'meal' }));

  // File 3: International Foods (55 items)
  const intlFoodsRaw = JSON.parse(fs.readFileSync(path.join(dbDir, 'international_food_database.json'), 'utf8'));
  const intlFoods = intlFoodsRaw.foods.map(item => ({ ...item, type: 'meal' }));

  const allFoods = [...ingredients, ...vnFoods, ...intlFoods];
  console.log(`📦 Đã load: ${ingredients.length} ingredients + ${vnFoods.length} VN foods + ${intlFoods.length} intl foods = ${allFoods.length} tổng`);
  return allFoods;
}

// ============================================
// 3. Import tất cả vào DynamoDB
// ============================================
async function seedFoods(allFoods) {
  console.log(`🔄 Bắt đầu import ${allFoods.length} items lên DynamoDB...`);
  console.log(`📦 Bảng: ${TABLE_NAME}`);
  console.log('==========================================');

  let successCount = 0;
  let failCount = 0;

  for (const food of allFoods) {
    const now = new Date().toISOString();
    const item = {
      ...food,
      createdAt: now,
      updatedAt: now,
      __typename: 'Food',
    };

    try {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }));
      console.log(`✅ [${food.type}] ${food.food_id} | ${food.name_vi}`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${food.food_id} | ${food.name_vi}:`, error.message);
      failCount++;
    }
  }

  console.log('==========================================');
  console.log(`🎉 Hoàn tất! Thành công: ${successCount} | Thất bại: ${failCount}`);
}

// ============================================
// Main
// ============================================
async function main() {
  // Bước 1: Xóa sạch dữ liệu cũ
  await clearTable();

  // Bước 2: Load + gộp 3 file JSON
  const allFoods = loadAllFoods();

  // Bước 3: Import lên DynamoDB
  await seedFoods(allFoods);

  // Bước 4: Verify
  const verifyResult = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    Select: 'COUNT',
  }));
  console.log(`\n📊 Verify: Bảng Food hiện có ${verifyResult.Count} records.`);
}

main();
