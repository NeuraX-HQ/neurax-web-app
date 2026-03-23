import { S3Handler } from 'aws-lambda';
import { S3Client, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    // Cấu trúc mong đợi: incoming/{user_id}/{type}/{filename}
    const parts = key.split('/');
    if (parts.length < 4 || parts[0] !== 'incoming') {
      console.warn(`File ${key} không đúng cấu trúc Landing Zone. Bỏ qua.`);
      continue;
    }

    const userId = parts[1];
    const type = parts[2];
    const originalFilename = parts[3];

    console.log(`Processing: User=${userId}, Type=${type}, File=${originalFilename}`);

    try {
      // 1. Xác nhận loại ảnh (Secure Check)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
      const objectInfo = await s3Client.send(headCommand);
      
      const contentType = objectInfo.ContentType || '';
      if (!allowedTypes.includes(contentType)) {
        console.error(`Định dạng không hỗ trợ: ${contentType}. Đang xóa file rác.`);
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        continue;
      }

      // 2. Logic Resize & Transcode (Placeholder cho Sharp/Jimp)
      // Tối ưu: Chuyển sang .webp để giảm dung lượng
      const newUuid = Math.random().toString(36).substring(2, 11);
      const processedKey = `media/${userId}/${type}/${newUuid}.webp`;

      console.log(`Đang tối ưu hóa và di chuyển: ${key} -> ${processedKey}`);
      
      // 3. Sao chép vào vùng Media (An toàn)
      // Trong thực tế, bạn sẽ dùng Sharp để buffer -> upload. 
      // Ở đây ta dùng CopyObject để minh họa luồng di chuyển an toàn.
      await s3Client.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: processedKey,
        ContentType: 'image/webp' // Giả lập sau khi convert
      }));

      // 4. Dọn dẹp Landing Zone
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

      console.log(`Hoàn tất: File an toàn đã được lưu tại ${processedKey}`);
    } catch (err) {
      console.error(`Lỗi khi xử lý file ${key}:`, err);
    }
  }
};
