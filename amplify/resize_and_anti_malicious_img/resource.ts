import { defineFunction } from '@aws-amplify/backend';

export const resizeAndAntiMaliciousImg = defineFunction({
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  resourceGroupName: 'storage'
});
