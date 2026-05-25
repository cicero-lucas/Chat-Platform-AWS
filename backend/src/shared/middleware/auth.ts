import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { logger } from '../utils/logger';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: string;
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export async function extractAuthContext(event: APIGatewayProxyEvent): Promise<AuthContext> {
  const token = event.headers?.Authorization?.replace('Bearer ', '') ??
    event.headers?.authorization?.replace('Bearer ', '');

  if (!token) throw new Error('Missing authorization token');

  const payload = await verifier.verify(token);

  return {
    userId: payload.sub,
    email: payload.email as string,
    name: (payload.name ?? payload.email) as string,
    role: (payload['custom:role'] ?? 'USER') as string,
  };
}

export function withAuth(
  handler: (event: APIGatewayProxyEvent, auth: AuthContext) => Promise<APIGatewayProxyResult>
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const auth = await extractAuthContext(event);
      return await handler(event, auth);
    } catch (error) {
      logger.warn('Auth failed', { error: (error as Error).message });
      return {
        statusCode: 401,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }
  };
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json',
  };
}

export function response(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}
