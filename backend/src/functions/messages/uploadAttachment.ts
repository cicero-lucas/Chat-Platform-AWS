import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import { withAuth, response, AuthContext } from '../../shared/middleware/auth';
import { logger } from '../../shared/utils/logger';

const s3 = new S3Client({});
const BUCKET = process.env.S3_ATTACHMENTS_BUCKET!;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const UploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), 'File type not allowed'),
  fileSize: z.number().max(MAX_SIZE, 'File too large (max 10MB)'),
  roomId: z.string().min(1),
});

export const handler = withAuth(
  async (event: APIGatewayProxyEvent, auth: AuthContext): Promise<APIGatewayProxyResult> => {
    const parsed = UploadSchema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!parsed.success) {
      return response(400, { error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { fileName, contentType, roomId } = parsed.data;
    const key = `${roomId}/${auth.userId}/${Date.now()}-${fileName}`;

    try {
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: contentType,
          Metadata: {
            uploadedBy: auth.userId,
            roomId,
          },
        }),
        { expiresIn: 300 }
      );

      logger.info('Presigned URL generated', { key, userId: auth.userId });
      return response(200, {
        uploadUrl: url,
        key,
        expiresIn: 300,
      });
    } catch (error) {
      logger.error('Presigned URL generation failed', { error: (error as Error).message });
      return response(500, { error: 'Internal server error' });
    }
  }
);
