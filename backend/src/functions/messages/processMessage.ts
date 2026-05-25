import { SQSEvent, SQSRecord } from 'aws-lambda';
import { messageRepo, connectionRepo, createWebSocketService } from '../../shared/container';
import { aiService } from '../../shared/container';
import { Message } from '../../domain/entities/Message';
import { logger } from '../../shared/utils/logger';

interface MessageEvent {
  type: 'MESSAGE_CREATED';
  payload: Message;
}

async function processRecord(record: SQSRecord): Promise<void> {
  const event: MessageEvent = JSON.parse(record.body);

  if (event.type !== 'MESSAGE_CREATED') return;

  const message = event.payload;

  const [moderation] = await Promise.all([
    aiService.moderateMessage(message.content),
  ]);

  const newStatus = moderation.isSafe ? 'DELIVERED' : 'MODERATED';

  await messageRepo.updateStatus(message.messageId, message.roomId, newStatus);

  if (!moderation.isSafe) {
    logger.warn('Message moderated', {
      messageId: message.messageId,
      score: moderation.score,
    });
    return;
  }

  const wsEndpoint = process.env.WEBSOCKET_API_ENDPOINT!;
  const wsService = createWebSocketService(wsEndpoint);

  const connections = await connectionRepo.findByRoom(message.roomId);
  const connectionIds = connections
    .filter((c) => c.userId !== message.senderId)
    .map((c) => c.connectionId);

  if (connectionIds.length === 0) return;

  const staleConnections = await wsService.broadcast(connectionIds, {
    type: 'NEW_MESSAGE',
    payload: { ...message, status: newStatus },
  });

  if (staleConnections.length > 0) {
    await Promise.all(staleConnections.map((id) => connectionRepo.delete(id)));
    logger.info('Cleaned stale connections', { count: staleConnections.length });
  }
}

export const handler = async (event: SQSEvent): Promise<{ batchItemFailures: { itemIdentifier: string }[] }> => {
  const failures: { itemIdentifier: string }[] = [];

  await Promise.allSettled(
    event.Records.map(async (record) => {
      try {
        await processRecord(record);
      } catch (error) {
        logger.error('Failed to process SQS record', {
          messageId: record.messageId,
          error: (error as Error).message,
        });
        failures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  return { batchItemFailures: failures };
};
