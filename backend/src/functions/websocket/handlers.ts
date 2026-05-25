import {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { connectionRepo, userRepo } from '../../shared/container';
import { Connection } from '../../domain/entities/User';
import { logger } from '../../shared/utils/logger';

function wsResponse(statusCode: number): APIGatewayProxyResult {
  return { statusCode, body: '' };
}

export const connectHandler = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId;

  if (!userId) return wsResponse(401);

  const connection: Connection = {
    connectionId,
    userId,
    connectedAt: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 86400,
  };

  await Promise.all([
    connectionRepo.save(connection),
    userRepo.updateStatus(userId, 'ONLINE'),
  ]);

  logger.info('WebSocket connected', { connectionId, userId });
  return wsResponse(200);
};

export const disconnectHandler = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;

  const connection = await connectionRepo.findById(connectionId);
  if (connection) {
    await Promise.all([
      connectionRepo.delete(connectionId),
      userRepo.updateStatus(connection.userId, 'OFFLINE'),
    ]);
  }

  logger.info('WebSocket disconnected', { connectionId });
  return wsResponse(200);
};

export const messageHandler = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;

  try {
    const body = JSON.parse(event.body ?? '{}');

    if (body.action === 'joinRoom') {
      const { roomId } = body;
      const connection = await connectionRepo.findById(connectionId);
      if (connection) {
        await connectionRepo.save({ ...connection, roomId });
        logger.info('User joined room', { connectionId, roomId });
      }
    }

    return wsResponse(200);
  } catch (error) {
    logger.error('WebSocket message error', { error: (error as Error).message });
    return wsResponse(500);
  }
};
