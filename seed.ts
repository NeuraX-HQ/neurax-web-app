import { generateClient } from 'aws-amplify/data';
import type { Schema } from './amplify/data/resource';
import * as fs from 'fs';
import * as path from 'path';

// Need to set up polyfills for NodeJS environment to run Amplify client
import 'crypto';
if (!globalThis.crypto) {
    globalThis.crypto = require('crypto');
}

import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

Amplify.configure(outputs);

const client = generateClient<Schema>();

async function seedDatabase() {
    console.log('🌱 Starting Database Seeder...');
    
    try {
        const dbPath = path.join(__dirname, 'db', 'ingredients_database.json');
        console.log(`Reading data from: ${dbPath}`);
        
        const fileData = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(fileData);
        
        const items = db.items || db.foods || [];
        console.log(`Found ${items.length} items to insert.`);

        let successCount = 0;
        let failCount = 0;

        for (const item of items) {
            try {
                // Formatting data to fit our schema exactly
                const inputData = {
                    food_id: item.food_id,
                    name_vi: item.name_vi,
                    name_en: item.name_en,
                    aliases_vi: item.aliases_vi || [],
                    aliases_en: item.aliases_en || [],
                    macros: item.macros ? {
                        calories: item.macros.calories,
                        protein_g: item.macros.protein_g,
                        carbs_g: item.macros.carbs_g,
                        fat_g: item.macros.fat_g,
                        saturated_fat_g: item.macros.saturated_fat_g,
                        polyunsaturated_fat_g: item.macros.polyunsaturated_fat_g,
                        monounsaturated_fat_g: item.macros.monounsaturated_fat_g,
                        fiber_g: item.macros.fiber_g,
                        sugar_g: item.macros.sugar_g,
                        sodium_mg: item.macros.sodium_mg,
                        cholesterol_mg: item.macros.cholesterol_mg,
                        potassium_mg: item.macros.potassium_mg,
                    } : null,
                    micronutrients: item.micronutrients ? {
                        calcium_mg: item.micronutrients.calcium_mg,
                        iron_mg: item.micronutrients.iron_mg,
                        vitamin_a_ug: item.micronutrients.vitamin_a_ug,
                        vitamin_c_mg: item.micronutrients.vitamin_c_mg,
                    } : null,
                    serving: item.serving ? {
                        default_g: item.serving.default_g,
                        unit: item.serving.unit,
                        portions: item.serving.portions ? {
                            small: item.serving.portions.small,
                            medium: item.serving.portions.medium,
                            large: item.serving.portions.large,
                        } : null
                    } : null,
                    verified: item.verified ?? true,
                    source: item.source || 'Imported Script'
                };

                let response;
                
                try {
                    response = await client.models.Food.create(inputData, {
                        authMode: 'iam' // User identity pool or IAM
                    });
                } catch (e: any) {
                    // If it's a conflict, it means it already exists, which is fine
                    if (e.message?.includes('ConditionalCheckFailedException') || e.errorType?.includes('Conditional')) {
                        process.stdout.write('🔄 ');
                        successCount++;
                        continue;
                    }
                    throw e;
                }

                if (response?.errors) {
                    const isConflict = response.errors.some((e: any) => 
                        e.errorType === 'DynamoDB:ConditionalCheckFailedException'
                    );
                    
                    if (isConflict) {
                        process.stdout.write('🔄 '); // Already exists
                        successCount++;
                    } else {
                        console.error(`\nFailed to insert ${item.name_vi}:`, response.errors);
                        failCount++;
                    }
                } else {
                    process.stdout.write('✅ ');
                    successCount++;
                }

            } catch (err) {
                console.error(`\n❌ Error processing ${item.name_vi}:`, err);
                failCount++;
            }
        }

        console.log('\n\n📊 Seed Summary:');
        console.log(`-------------------`);
        console.log(`Total Attempted: ${items.length}`);
        console.log(`Successfully Inserted: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log(`-------------------`);

    } catch (error) {
        console.error('Fatal Error during seeding:', error);
    }
}

seedDatabase();
