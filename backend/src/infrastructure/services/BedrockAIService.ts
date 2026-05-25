import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { Message } from '../../domain/entities/Message';
import { logger } from '../../shared/utils/logger';

interface AIResponse {
  summary?: string;
  suggestions?: string[];
  moderationScore?: number;
  isSafe?: boolean;
}

export class BedrockAIService {
  private readonly client = new BedrockRuntimeClient({});
  private readonly modelId = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-haiku-20240307-v1:0';

  private async invoke(prompt: string): Promise<string> {
    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const response = await this.client.send(new InvokeModelCommand({
      modelId: this.modelId,
      body,
      contentType: 'application/json',
      accept: 'application/json',
    }));

    const result = JSON.parse(Buffer.from(response.body).toString());
    return result.content[0].text;
  }

  async summarizeConversation(messages: Message[]): Promise<string> {
    const conversation = messages
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    const prompt = `Resuma a seguinte conversa de chat corporativo em 2-3 frases objetivas em português:\n\n${conversation}\n\nResumo:`;

    try {
      return await this.invoke(prompt);
    } catch (error) {
      logger.error('Bedrock summarize error', { error });
      return 'Resumo indisponível no momento.';
    }
  }

  async suggestReplies(lastMessages: Message[], userId: string): Promise<string[]> {
    const context = lastMessages
      .slice(-5)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    const prompt = `Com base nesta conversa de chat corporativo, sugira 3 respostas curtas e profissionais em português para o usuário responder. Retorne apenas as sugestões, uma por linha, sem numeração:\n\n${context}`;

    try {
      const result = await this.invoke(prompt);
      return result.split('\n').filter((s) => s.trim().length > 0).slice(0, 3);
    } catch (error) {
      logger.error('Bedrock suggest error', { error });
      return [];
    }
  }

  async moderateMessage(content: string): Promise<{ score: number; isSafe: boolean }> {
    const prompt = `Analise a seguinte mensagem de chat corporativo e retorne um JSON com:
- score: número de 0 a 1 indicando nível de toxicidade (0=seguro, 1=muito tóxico)
- isSafe: boolean indicando se a mensagem é apropriada para ambiente corporativo
- reason: breve explicação

Mensagem: "${content}"

Retorne apenas o JSON, sem explicações adicionais.`;

    try {
      const result = await this.invoke(prompt);
      const parsed = JSON.parse(result);
      return { score: parsed.score ?? 0, isSafe: parsed.isSafe ?? true };
    } catch {
      return { score: 0, isSafe: true };
    }
  }
}
