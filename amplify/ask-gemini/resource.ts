import { defineFunction, secret } from '@aws-amplify/backend';

export const askGemini = defineFunction({
  name: 'ask-gemini',
  entry: './handler.ts',
  runtime: 20,
  memoryMB: 512,
  environment: {
    GEMINI_API_KEY: secret('GEMINI_API_KEY'),
  },
  timeoutSeconds: 30,
});
