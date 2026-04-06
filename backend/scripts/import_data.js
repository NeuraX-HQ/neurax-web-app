import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import fs from "fs";
import path from "path";

const REGION = "ap-southeast-2";
const TABLE_NAME = "Food-2c73cq2usbfgvp7eaihsupyjwe-NONE";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const files = [
  { path: "../data/ingredients_database.json", key: "items", source: "Ingredients" },
  { path: "../data/international_food_database.json", key: "foods", source: "International" },
  { path: "../data/vietnamese_food_database.json", key: "foods", source: "Vietnamese" },
];

async function importFile(fileInfo) {
  const filePath = path.resolve(new URL(import.meta.url).pathname.substring(1), "..", fileInfo.path);
  // Fix for Windows paths
  const decodedPath = decodeURIComponent(filePath).replace(/^\/([a-zA-Z]:)/, '$1');
  
  console.log(`Reading ${decodedPath}...`);
  const data = JSON.parse(fs.readFileSync(decodedPath, "utf8"));
  const items = data[fileInfo.key];

  console.log(`Found ${items.length} items in ${fileInfo.source} database.`);

  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    const putRequests = batch.map((item) => {
      // Structure the data to match the Food model
      const { food_id, name_vi, name_en, aliases_vi, aliases_en, macros, micronutrients, serving, verified, source } = item;
      return {
        PutRequest: {
          Item: {
            food_id,
            name_vi,
            name_en: name_en || null,
            aliases_vi: aliases_vi || [],
            aliases_en: aliases_en || [],
            macros: macros || null,
            micronutrients: micronutrients || null,
            serving: serving || null,
            verified: verified === undefined ? true : verified,
            source: source || fileInfo.source,
            __typename: "Food"
          },
        },
      };
    });

    try {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: putRequests,
          },
        })
      );
      console.log(`Imported batch of ${batch.length} items to ${TABLE_NAME}`);
    } catch (err) {
      console.error(`Error importing batch:`, err);
    }
  }
}

async function run() {
  for (const file of files) {
    await importFile(file);
  }
  console.log("Import completed!");
}

run();
