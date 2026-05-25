import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { withAuth, response, AuthContext } from '../../shared/middleware/auth';
import { sendMessageUseCase, rateLimiter } from '../../shared/container';
import { logger } from '../../shared/utils/logger';

const SendMessageSchema = z.object({
  roomId: z.string().min(1),
  content: z.string().min(1).max(4000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  attachmentKey: z.string().optional(),
  replyToMessageId: z.string().optional(),
});

export const handler = withAuth(
  async (event: APIGatewayProxyEvent, auth: AuthContext): Promise<APIGatewayProxyResult> => {
    const allowed = await rateLimiter.isAllowed(auth.userId, 'send-message');
    if (!allowed) {
      return response(429, { error: 'Rate limit exceeded. Max 60 messages per minute.' });
    }

    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return response(400, { error: 'Invalid JSON body' });
    }

    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return response(400, { error: 'Validation failed', details: parsed.error.flatten() });
    }

    try {
      const { message } = await sendMessageUseCase.execute({
        ...parsed.data,
        senderId: auth.userId,
        senderName: auth.name,
      });

      logger.info('Message sent', { messageId: message.messageId, roomId: message.roomId });
      return response(201, { message });
    } catch (error) {
      const err = error as Error;
      logger.error('Send message failed', { error: err.message });

      if (err.message.includes('not found') || err.message.includes('not a member')) {
        return response(403, { error: err.message });
      }
      return response(500, { error: 'Internal server error' });
    }
  }
);
