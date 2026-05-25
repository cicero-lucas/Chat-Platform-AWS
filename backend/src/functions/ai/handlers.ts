import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { withAuth, response, AuthContext } from '../../shared/middleware/auth';
import { getMessagesUseCase, aiService } from '../../shared/container';
import { logger } from '../../shared/utils/logger';

export const summarizeHandler = withAuth(
  async (event: APIGatewayProxyEvent, auth: AuthContext): Promise<APIGatewayProxyResult> => {
    const roomId = event.pathParameters?.roomId;
    if (!roomId) return response(400, { error: 'roomId is required' });

    try {
      const { items: messages } = await getMessagesUseCase.execute({
        roomId,
        userId: auth.userId,
        limit: 50,
      });

      if (messages.length === 0) {
        return response(200, { summary: 'Nenhuma mensagem para resumir.' });
      }

      const summary = await aiService.summarizeConversation(messages.reverse());
      logger.info('Conversation summarized', { roomId, messageCount: messages.length });

      return response(200, { summary, messageCount: messages.length });
    } catch (error) {
      const err = error as Error;
      logger.error('Summarize failed', { error: err.message });
      return response(500, { error: 'Internal server error' });
    }
  }
);

export const suggestHandler = withAuth(
  async (event: APIGatewayProxyEvent, auth: AuthContext): Promise<APIGatewayProxyResult> => {
    const roomId = event.pathParameters?.roomId;
    if (!roomId) return response(400, { error: 'roomId is required' });

    try {
      const { items: messages } = await getMessagesUseCase.execute({
        roomId,
        userId: auth.userId,
        limit: 10,
      });

      const suggestions = await aiService.suggestReplies(messages.reverse(), auth.userId);
      return response(200, { suggestions });
    } catch (error) {
      logger.error('Suggest failed', { error: (error as Error).message });
      return response(500, { error: 'Internal server error' });
    }
  }
);
