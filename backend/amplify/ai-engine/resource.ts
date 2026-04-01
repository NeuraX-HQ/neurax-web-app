import { defineFunction } from '@aws-amplify/backend';

export const aiEngine = defineFunction({
  name: 'ai-engine',
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  timeoutSeconds: 60, // Bedrock can take some time
});
