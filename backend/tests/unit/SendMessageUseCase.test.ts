import { SendMessageUseCase } from '../../../src/domain/usecases/SendMessageUseCase';
import { IMessageRepository } from '../../../src/domain/repositories/IMessageRepository';
import { IRoomRepository } from '../../../src/domain/repositories/IUserRepository';
import { Room } from '../../../src/domain/entities/User';

const mockRoom: Room = {
  roomId: 'room-1',
  name: 'General',
  createdBy: 'user-1',
  members: ['user-1', 'user-2'],
  isPrivate: false,
  createdAt: new Date().toISOString(),
};

const mockMessageRepo: jest.Mocked<IMessageRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByRoom: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
};

const mockRoomRepo: jest.Mocked<IRoomRepository> = {
  save: jest.fn(),
  findById: jest.fn().mockResolvedValue(mockRoom),
  findByUser: jest.fn(),
  addMember: jest.fn(),
  removeMember: jest.fn(),
  updateLastMessage: jest.fn(),
};

const mockQueueService = { sendMessage: jest.fn() };
const mockEventService = { publish: jest.fn() };

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SendMessageUseCase(
      mockMessageRepo,
      mockRoomRepo,
      mockQueueService,
      mockEventService,
      'https://sqs.us-east-1.amazonaws.com/123/queue'
    );
  });

  it('should send a message successfully', async () => {
    const input = {
      roomId: 'room-1',
      senderId: 'user-1',
      senderName: 'Alice',
      content: 'Hello World',
      type: 'TEXT' as const,
    };

    const { message } = await useCase.execute(input);

    expect(message.content).toBe('Hello World');
    expect(message.status).toBe('SENT');
    expect(message.senderId).toBe('user-1');
    expect(mockMessageRepo.save).toHaveBeenCalledWith(message);
    expect(mockQueueService.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockEventService.publish).toHaveBeenCalledWith('chat.messages', 'MessageCreated', message);
  });

  it('should throw when room not found', async () => {
    mockRoomRepo.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: 'nonexistent',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        type: 'TEXT',
      })
    ).rejects.toThrow('Room nonexistent not found');
  });

  it('should throw when user is not a room member', async () => {
    await expect(
      useCase.execute({
        roomId: 'room-1',
        senderId: 'user-999',
        senderName: 'Stranger',
        content: 'Hello',
        type: 'TEXT',
      })
    ).rejects.toThrow('User is not a member of this room');
  });

  it('should reject empty content', async () => {
    await expect(
      useCase.execute({
        roomId: 'room-1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: '',
        type: 'TEXT',
      })
    ).rejects.toThrow('Invalid message content');
  });

  it('should reject content exceeding 4000 characters', async () => {
    await expect(
      useCase.execute({
        roomId: 'room-1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'a'.repeat(4001),
        type: 'TEXT',
      })
    ).rejects.toThrow('Invalid message content');
  });
});
