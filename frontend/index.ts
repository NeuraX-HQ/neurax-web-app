import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import 'expo-router/entry';

Amplify.configure(outputs);

const config = Amplify.getConfig();
Amplify.configure({
  ...config,
  Auth: {
    ...config.Auth,
    Cognito: {
      ...config.Auth?.Cognito,
      loginWith: {
        ...config.Auth?.Cognito?.loginWith,
        oauth: {
          ...(config.Auth?.Cognito?.loginWith?.oauth ?? {}),
          domain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
        },
      },
    } as any,
  },
});