import Groq from "groq-sdk";
import { LLMProvider, LLMMessage, LLMTool, LLMChatOptions, ToolCallResult } from "../types";

export class GroqProvider implements LLMProvider {
  private client: Groq;
  private defaultModel: string;

  constructor(apiKey: string, model: string) {
    this.client = new Groq({ apiKey });
    this.defaultModel = model;
  }

  async generateChat(
    messages: LLMMessage[],
    options?: LLMChatOptions,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages: messages as unknown as Groq.Chat.ChatCompletionMessageParam[],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    });

    return response.choices[0]?.message?.content ?? "";
  }

  async generateWithTools(
    messages: LLMMessage[],
    tools: LLMTool[],
    options?: LLMChatOptions,
  ): Promise<{
    content: string | null;
    toolCalls: ToolCallResult[] | null;
  }> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages: messages as unknown as Groq.Chat.ChatCompletionMessageParam[],
      tools: tools as unknown as Groq.Chat.ChatCompletionTool[],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    });

    const choice = response.choices[0]?.message;
    if (!choice) return { content: null, toolCalls: null };

    if (choice.tool_calls && choice.tool_calls.length > 0) {
      return {
        content: choice.content,
        toolCalls: choice.tool_calls.map((tc: any) => ({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
      };
    }

    return { content: choice.content, toolCalls: null };
  }
}
