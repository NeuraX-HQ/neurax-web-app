import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'nutritrack_media_bucket',
  access: (allow) => ({
    // Khu vực hạ cánh (Landing Zone) - User upload trực tiếp vào đây
    'incoming/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Voice recordings - tạm lưu để Transcribe xử lý (ephemeral, Lambda xóa sau khi xong)
    'voice/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Avatar - owner write/delete (scoped to their identity), any authenticated user can read
    // allow.entity('identity') → IAM condition scoped to caller's identity (owner-only write)
    // allow.authenticated read → no identity scoping → any authenticated user can see any avatar
    'avatar/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
    ],
    // Khu vực lưu trữ vĩnh viễn (Trusted Zone) - Lambda sẽ lưu kết quả tại đây
    'media/{entity_id}/*': [
      allow.authenticated.to(['read', 'delete'])
    ]
  })
});
