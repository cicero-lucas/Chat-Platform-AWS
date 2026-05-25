import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { IQueueService, IEventService } from '../../domain/usecases/SendMessageUseCase';
import { logger } from '../../shared/utils/logger';

export class SQSQueueService implements IQueueService {
  private readonly client = new SQSClient({});

  async sendMessage(queueUrl: string, payload: unknown): Promise<void> {
    await this.client.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
      MessageGroupId: 'chat-messages',
    }));
  }
}

export class EventBridgeService implements IEventService {
  private readonly client = new EventBridgeClient({});

  async publish(source: string, detailType: string, detail: unknown): Promise<void> {
    await this.client.send(new PutEventsCommand({
      Entries: [{
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(detail),
        EventBusName: process.env.EVENT_BUS_NAME ?? 'default',
      }],
    }));
  }
}

export class WebSocketService {
  private readonly client: ApiGatewayManagementApiClient;

  constructor(endpoint: string) {
    this.client = new ApiGatewayManagementApiClient({ endpoint });
  }

  async sendToConnection(connectionId: string, data: unknown): Promise<boolean> {
    try {
      await this.client.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(data)),
      }));
      return true;
    } catch (error) {
      if (error instanceof GoneException) {
        logger.warn('Stale WebSocket connection', { connectionId });
        return false;
      }
      throw error;
    }
  }

  async broadcast(connectionIds: string[], data: unknown): Promise<string[]> {
    const staleConnections: string[] = [];
    await Promise.allSettled(
      connectionIds.map(async (id) => {
        const sent = await this.sendToConnection(id, data);
        if (!sent) staleConnections.push(id);
      })
    );
    return staleConnections;
  }
}
