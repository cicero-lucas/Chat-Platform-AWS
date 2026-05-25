import { RateLimiter } from '../../../src/shared/utils/rateLimiter';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const mockSend = jest.fn();
const mockClient = { send: mockSend } as unknown as DynamoDBDocumentClient;

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimiter = new RateLimiter(mockClient, 'test-table', 60, 60);
  });

  it('should allow request when under limit', async () => {
    mockSend.mockResolvedValueOnce({ Attributes: { count: 1 } });
    const allowed = await rateLimiter.isAllowed('user-1', 'send-message');
    expect(allowed).toBe(true);
  });

  it('should deny request when limit exceeded', async () => {
    const error = new Error('ConditionalCheckFailedException');
    error.name = 'ConditionalCheckFailedException';
    mockSend.mockRejectedValueOnce(error);

    const allowed = await rateLimiter.isAllowed('user-1', 'send-message');
    expect(allowed).toBe(false);
  });

  it('should allow request on DynamoDB error (fail open)', async () => {
    mockSend.mockRejectedValueOnce(new Error('ServiceUnavailable'));
    const allowed = await rateLimiter.isAllowed('user-1', 'send-message');
    expect(allowed).toBe(true);
  });
});
