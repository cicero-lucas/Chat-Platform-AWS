import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, response, AuthContext } from '../../shared/middleware/auth';
import { getMessagesUseCase } from '../../shared/container';
import { logger } from '../../shared/utils/logger';

export const handler = withAuth(
  async (event: APIGatewayProxyEvent, auth: AuthContext): Promise<APIGatewayProxyResult> => {
    const roomId = event.pathParameters?.roomId;
    if (!roomId) return response(400, { error: 'roomId is required' });

    const limit = Math.min(Number(event.queryStringParameters?.limit ?? 50), 100);
    const lastKey = event.queryStringParameters?.lastKey
      ? JSON.parse(Buffer.from(event.queryStringParameters.lastKey, 'base64').toString())
      : undefined;

    try {
      const result = await getMessagesUseCase.execute({
        roomId,
        userId: auth.userId,
        limit,
        lastKey,
      });

      const nextKey = result.lastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
        : undefined;

      return response(200, {
        messages: result.items,
        nextKey,
        count: result.items.length,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Get messages failed', { error: err.message, roomId });

      if (err.message.includes('Access denied') || err.message.includes('not found')) {
        return response(403, { error: err.message });
      }
      return response(500, { error: 'Internal server error' });
    }
  }
);
