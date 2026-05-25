import { Message, MessageEntity, CreateMessageInput } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IRoomRepository } from '../repositories/IUserRepository';

export interface IQueueService {
  sendMessage(queueUrl: string, payload: unknown): Promise<void>;
}

export interface IEventService {
  publish(source: string, detailType: string, detail: unknown): Promise<void>;
}

export interface SendMessageOutput {
  message: Message;
}

export class SendMessageUseCase {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly roomRepo: IRoomRepository,
    private readonly queueService: IQueueService,
    private readonly eventService: IEventService,
    private readonly messagesQueueUrl: string
  ) {}

  async execute(input: CreateMessageInput): Promise<SendMessageOutput> {
    const room = await this.roomRepo.findById(input.roomId);
    if (!room) throw new Error(`Room ${input.roomId} not found`);

    if (!room.members.includes(input.senderId)) {
      throw new Error('User is not a member of this room');
    }

    const message = MessageEntity.create(input);

    if (!MessageEntity.isValid(message)) {
      throw new Error('Invalid message content');
    }

    await this.messageRepo.save(message);

    await Promise.all([
      this.queueService.sendMessage(this.messagesQueueUrl, {
        type: 'MESSAGE_CREATED',
        payload: message,
      }),
      this.roomRepo.updateLastMessage(input.roomId, message.createdAt),
      this.eventService.publish('chat.messages', 'MessageCreated', message),
    ]);

    return { message };
  }
}
