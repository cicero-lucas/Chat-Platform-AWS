export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY';
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  status: UserStatus;
  role: UserRole;
  lastSeenAt: string;
  createdAt: string;
}

export interface Room {
  roomId: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  isPrivate: boolean;
  lastMessageAt?: string;
  createdAt: string;
}

export interface Connection {
  connectionId: string;
  userId: string;
  roomId?: string;
  connectedAt: string;
  ttl: number;
}
