import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'nutritrack_media_bucket',
  access: (allow) => ({
    // Khu vực hạ cánh (Landing Zone) - User upload trực tiếp vào đây
    'incoming/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Khu vực lưu trữ vĩnh viễn (Trusted Zone) - Lambda sẽ lưu kết quả tại đây
    'media/{entity_id}/*': [
      allow.authenticated.to(['read', 'delete'])
    ]
  })
});
