import { defineFunction } from '@aws-amplify/backend';

export const askBedrock = defineFunction({
  name: 'ask-bedrock',
  entry: './handler.ts',
  timeoutSeconds: 60, // Bedrock can take some time
});
