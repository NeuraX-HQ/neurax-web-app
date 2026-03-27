import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({

  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid']
      },
      callbackUrls: [
        'nutritrack://',
        'https://nutri-track.link/home',
        'https://feat-phase3-frontend-integration.d1glc6vvop0xlb.amplifyapp.com/home'
      ],
      logoutUrls: [
        'nutritrack://',
        'https://nutri-track.link/welcome',
        'https://feat-phase3-frontend-integration.d1glc6vvop0xlb.amplifyapp.com/welcome'
      ]
    }
  },

  userAttributes: {
    email: {
      required: true
    },
    preferredUsername: {
      required: false
    }
  },
});
