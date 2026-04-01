import { defineFunction } from '@aws-amplify/backend';

export const processNutrition = defineFunction({
  name: 'process-nutrition',
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  timeoutSeconds: 30,
  resourceGroupName: 'data',
});
