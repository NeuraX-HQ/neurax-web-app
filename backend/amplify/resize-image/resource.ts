import { defineFunction } from '@aws-amplify/backend';

export const resizeImage = defineFunction({
  name: 'resize-image',
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  layers:{
    "sharp": "arn:aws:lambda:ap-southeast-2:966000660990:layer:sharp-node-layer:1",
  },
  resourceGroupName: 'storage',
});
