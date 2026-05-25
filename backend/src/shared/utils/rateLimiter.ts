import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export class RateLimiter {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    private readonly maxRequests: number = 60,
    private readonly windowSeconds: number = 60
  ) {}

  async isAllowed(userId: string, action: string): Promise<boolean> {
    const key = `${userId}#${action}`;
    const windowStart = Math.floor(Date.now() / 1000 / this.windowSeconds) * this.windowSeconds;
    const ttl = windowStart + this.windowSeconds * 2;

    try {
      const result = await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `RATE#${key}`, sk: String(windowStart) },
        UpdateExpression: 'ADD #count :inc SET #ttl = :ttl',
        ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
        ExpressionAttributeValues: { ':inc': 1, ':ttl': ttl, ':max': this.maxRequests },
        ConditionExpression: 'attribute_not_exists(#count) OR #count < :max',
        ReturnValues: 'UPDATED_NEW',
      }));

      return !!result.Attributes;
    } catch (error: unknown) {
      if ((error as { name?: string }).name === 'ConditionalCheckFailedException') {
        return false;
      }
      return true;
    }
  }
}
