import { Message, CreateMessageInput } from '../entities/Message';

export interface PaginatedResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  findById(messageId: string, roomId: string): Promise<Message | null>;
  findByRoom(
    roomId: string,
    limit?: number,
    lastKey?: Record<string, unknown>
  ): Promise<PaginatedResult<Message>>;
  updateStatus(messageId: string, roomId: string, status: Message['status']): Promise<void>;
  delete(messageId: string, roomId: string): Promise<void>;
}
