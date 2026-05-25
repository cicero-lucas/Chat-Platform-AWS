import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Message } from '../../domain/entities/Message';
import { IMessageRepository, PaginatedResult } from '../../domain/repositories/IMessageRepository';

export class DynamoMessageRepository implements IMessageRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async save(message: Message): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: message,
      ConditionExpression: 'attribute_not_exists(messageId)',
    }));
  }

  async findById(messageId: string, roomId: string): Promise<Message | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { messageId, roomId },
    }));
    return (result.Item as Message) ?? null;
  }

  async findByRoom(
    roomId: string,
    limit = 50,
    lastKey?: Record<string, unknown>
  ): Promise<PaginatedResult<Message>> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'roomId-createdAt-index',
      KeyConditionExpression: 'roomId = :roomId',
      ExpressionAttributeValues: { ':roomId': roomId },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: lastKey,
    }));

    return {
      items: (result.Items as Message[]) ?? [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  async updateStatus(messageId: string, roomId: string, status: Message['status']): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { messageId, roomId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
    }));
  }

  async delete(messageId: string, roomId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { messageId, roomId },
    }));
  }
}
