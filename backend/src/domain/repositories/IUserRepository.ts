import { User, Room, Connection } from '../entities/User';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateStatus(userId: string, status: User['status']): Promise<void>;
  listByRoom(roomId: string): Promise<User[]>;
}

export interface IRoomRepository {
  save(room: Room): Promise<void>;
  findById(roomId: string): Promise<Room | null>;
  findByUser(userId: string): Promise<Room[]>;
  addMember(roomId: string, userId: string): Promise<void>;
  removeMember(roomId: string, userId: string): Promise<void>;
  updateLastMessage(roomId: string, timestamp: string): Promise<void>;
}

export interface IConnectionRepository {
  save(connection: Connection): Promise<void>;
  findById(connectionId: string): Promise<Connection | null>;
  findByUser(userId: string): Promise<Connection[]>;
  findByRoom(roomId: string): Promise<Connection[]>;
  delete(connectionId: string): Promise<void>;
}
