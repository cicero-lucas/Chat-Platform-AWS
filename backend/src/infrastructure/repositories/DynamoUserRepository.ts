import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { User, Room, Connection } from '../../domain/entities/User';
import {
  IUserRepository,
  IRoomRepository,
  IConnectionRepository,
} from '../../domain/repositories/IUserRepository';

export class DynamoUserRepository implements IUserRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async save(user: User): Promise<void> {
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: user }));
  }

  async findById(userId: string): Promise<User | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { userId },
    }));
    return (result.Item as User) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
      Limit: 1,
    }));
    return (result.Items?.[0] as User) ?? null;
  }

  async updateStatus(userId: string, status: User['status']): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { userId },
      UpdateExpression: 'SET #status = :status, lastSeenAt = :lastSeenAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':lastSeenAt': new Date().toISOString(),
      },
    }));
  }

  async listByRoom(_roomId: string): Promise<User[]> {
    return [];
  }
}

export class DynamoRoomRepository implements IRoomRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async save(room: Room): Promise<void> {
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: room }));
  }

  async findById(roomId: string): Promise<Room | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { roomId },
    }));
    return (result.Item as Room) ?? null;
  }

  async findByUser(userId: string): Promise<Room[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'members-index',
      KeyConditionExpression: 'contains(members, :userId)',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return (result.Items as Room[]) ?? [];
  }

  async addMember(roomId: string, userId: string): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { roomId },
      UpdateExpression: 'ADD members :userId',
      ExpressionAttributeValues: { ':userId': new Set([userId]) },
    }));
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { roomId },
      UpdateExpression: 'DELETE members :userId',
      ExpressionAttributeValues: { ':userId': new Set([userId]) },
    }));
  }

  async updateLastMessage(roomId: string, timestamp: string): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { roomId },
      UpdateExpression: 'SET lastMessageAt = :ts',
      ExpressionAttributeValues: { ':ts': timestamp },
    }));
  }
}

export class DynamoConnectionRepository implements IConnectionRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async save(connection: Connection): Promise<void> {
    await this.client.send(new PutCommand({ TableName: this.tableName, Item: connection }));
  }

  async findById(connectionId: string): Promise<Connection | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { connectionId },
    }));
    return (result.Item as Connection) ?? null;
  }

  async findByUser(userId: string): Promise<Connection[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    return (result.Items as Connection[]) ?? [];
  }

  async findByRoom(roomId: string): Promise<Connection[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'roomId-index',
      KeyConditionExpression: 'roomId = :roomId',
      ExpressionAttributeValues: { ':roomId': roomId },
    }));
    return (result.Items as Connection[]) ?? [];
  }

  async delete(connectionId: string): Promise<void> {
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { connectionId },
    }));
  }
}
