import { Message } from '../entities/Message';
import { IMessageRepository, PaginatedResult } from '../repositories/IMessageRepository';

export interface GetMessagesInput {
  roomId: string;
  userId: string;
  limit?: number;
  lastKey?: Record<string, unknown>;
}

export class GetMessagesUseCase {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly roomRepo: import('../repositories/IUserRepository').IRoomRepository
  ) {}

  async execute(input: GetMessagesInput): Promise<PaginatedResult<Message>> {
    const room = await this.roomRepo.findById(input.roomId);
    if (!room) throw new Error(`Room ${input.roomId} not found`);

    if (!room.members.includes(input.userId)) {
      throw new Error('Access denied');
    }

    return this.messageRepo.findByRoom(input.roomId, input.limit ?? 50, input.lastKey);
  }
}
