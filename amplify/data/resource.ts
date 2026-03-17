import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { askGemini } from '../ask-gemini/resource';
import { processNutrition } from '../process-nutrition/resource';


const schema = a.schema({
  //========================================
  // Food Database
  //========================================
  Portions: a.customType({
    small: a.float(),
    medium: a.float(),
    large: a.float(),
  }),

  Serving: a.customType({
    default_g: a.float(),
    unit: a.string(),
    portions: a.ref('Portions'),
  }),

  Micronutrients: a.customType({
    calcium_mg: a.float(),
    iron_mg: a.float(),
    vitamin_a_ug: a.float(),
    vitamin_c_mg: a.float(),
  }),

  Macros: a.customType({
    calories: a.float(),
    protein_g: a.float(),
    carbs_g: a.float(),
    fat_g: a.float(),
    saturated_fat_g: a.float(),
    polyunsaturated_fat_g: a.float(),
    monounsaturated_fat_g: a.float(),
    fiber_g: a.float(),
    sugar_g: a.float(),
    sodium_mg: a.float(),
    cholesterol_mg: a.float(),
    potassium_mg: a.float(),
  }),

  Food: a
    .model({
      food_id: a.string().required(),
      name_vi: a.string().required(),
      name_en: a.string(),
      aliases_vi: a.string().array(),
      aliases_en: a.string().array(),
      macros: a.ref('Macros'),
      micronutrients: a.ref('Micronutrients'),
      serving: a.ref('Serving'),
      verified: a.boolean(),
      source: a.string(),
    })
    .identifier(['food_id'])
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read'])
    ]),

  //========================================
  // User Database
  //========================================
  biometric: a.customType({
    age: a.integer(),
    gender: a.string(),
    height_cm: a.float(),
    weight_kg: a.float(),
    active_level: a.string(),
  }),

  goal: a.customType({
    daily_calories: a.float(),
    daily_carbs_g: a.float(),
    daily_protein_g: a.float(),
    daily_fat_g: a.float(),
    target_weight_kg: a.float(), 
  }),

  dietary_profile: a.customType({
    allergies: a.string().array(),
    preferences: a.string().array(),
  }),

  gamification: a.customType({
    current_streak: a.integer(),
    longest_streak: a.integer(),
    last_log_date: a.string(),
    total_points: a.integer(),
    coach_tone: a.string(),
  }),

  user: a
    .model({
      user_id: a.string().required(),
      email: a.string().required(),
      display_name: a.string(),
      avatar_url: a.string(),
      created_at: a.string(),
      updated_at: a.string(),
      onboarding_status: a.boolean(),
      biometric: a.ref('biometric'),
      goal: a.ref('goal'),
      dietary_profile: a.ref('dietary_profile'),
      gamification: a.ref('gamification'),
    })
    .identifier(['user_id'])
    .authorization((allow) => [
      allow.owner(),
    ]),


  //========================================
  // Gemini
  //========================================
  askGemini: a
    .query()
    .arguments({
      action: a.string().required(),
      payload: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(askGemini))
    .authorization((allow) => [allow.authenticated()]),

  //========================================
  // Process Nutrition (DB verify + AI fallback)
  //========================================
  processNutrition: a
    .query()
    .arguments({ payload: a.string().required() })
    .returns(a.string())
    .handler(a.handler.function(processNutrition))
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
