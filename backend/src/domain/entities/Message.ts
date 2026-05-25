export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'MODERATED';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface Message {
  messageId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  attachmentUrl?: string;
  attachmentKey?: string;
  replyToMessageId?: string;
  aiSuggested?: boolean;
  moderationScore?: number;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

export interface CreateMessageInput {
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  attachmentKey?: string;
  replyToMessageId?: string;
}

export class MessageEntity {
  static create(input: CreateMessageInput): Message {
    const now = new Date().toISOString();
    return {
      messageId: crypto.randomUUID(),
      ...input,
      status: 'SENT',
      createdAt: now,
      updatedAt: now,
    };
  }

  static isValid(message: Message): boolean {
    return (
      message.content.length > 0 &&
      message.content.length <= 4000 &&
      message.roomId.length > 0 &&
      message.senderId.length > 0
    );
  }
}
