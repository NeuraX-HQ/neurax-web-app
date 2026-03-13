import { defineFunction } from '@aws-amplify/backend';

export const resizeAndAntiMaliciousImg = defineFunction({
  entry: './handler.ts'
});
