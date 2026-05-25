import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoMessageRepository } from '../infrastructure/repositories/DynamoMessageRepository';
import {
  DynamoUserRepository,
  DynamoRoomRepository,
  DynamoConnectionRepository,
} from '../infrastructure/repositories/DynamoUserRepository';
import { SQSQueueService, EventBridgeService, WebSocketService } from '../infrastructure/services/AwsServices';
import { BedrockAIService } from '../infrastructure/services/BedrockAIService';
import { RateLimiter } from '../shared/utils/rateLimiter';
import { SendMessageUseCase } from '../domain/usecases/SendMessageUseCase';
import { GetMessagesUseCase } from '../domain/usecases/GetMessagesUseCase';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export const messageRepo = new DynamoMessageRepository(
  dynamoClient,
  process.env.DYNAMODB_MESSAGES_TABLE!
);

export const userRepo = new DynamoUserRepository(
  dynamoClient,
  process.env.DYNAMODB_USERS_TABLE!
);

export const roomRepo = new DynamoRoomRepository(
  dynamoClient,
  process.env.DYNAMODB_ROOMS_TABLE!
);

export const connectionRepo = new DynamoConnectionRepository(
  dynamoClient,
  process.env.DYNAMODB_CONNECTIONS_TABLE!
);

export const sqsService = new SQSQueueService();
export const eventService = new EventBridgeService();
export const aiService = new BedrockAIService();

export const rateLimiter = new RateLimiter(
  dynamoClient,
  process.env.DYNAMODB_USERS_TABLE!,
  Number(process.env.RATE_LIMIT_MESSAGES_PER_MINUTE ?? 60)
);

export const sendMessageUseCase = new SendMessageUseCase(
  messageRepo,
  roomRepo,
  sqsService,
  eventService,
  process.env.SQS_MESSAGES_QUEUE_URL!
);

export const getMessagesUseCase = new GetMessagesUseCase(messageRepo, roomRepo);

export function createWebSocketService(endpoint: string): WebSocketService {
  return new WebSocketService(endpoint);
}
