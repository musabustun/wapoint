import {
  GoogleGenerativeAI,
  GenerativeModel,
} from "@google/generative-ai";
import { LLMProvider, LLMMessage, LLMTool, LLMChatOptions, ToolCallResult } from "../types";

export class GoogleProvider implements LLMProvider {
  private model: GenerativeModel;
  private defaultModel: string;

  constructor(apiKey: string, model: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = model;
    this.model = genAI.getGenerativeModel({ model });
  }

  private toGeminiMessages(messages: LLMMessage[]) {
    const systemMsg = messages.filter((m) => m.role === "system").pop();
    const history = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : ("user" as "user" | "model"),
        parts: [{ text: m.content }],
      }));

    return { systemInstruction: systemMsg?.content, history };
  }

  async generateChat(
    messages: LLMMessage[],
    options?: LLMChatOptions,
  ): Promise<string> {
    const { systemInstruction, history } = this.toGeminiMessages(messages);
    const lastMsg = history.pop();

    if (!lastMsg) return "";

    const chat = this.model.startChat({
      systemInstruction,
      history: history as any,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    });

    const result = await chat.sendMessage(lastMsg.parts[0].text);
    return result.response.text();
  }

  async generateWithTools(
    messages: LLMMessage[],
    _tools: LLMTool[],
    options?: LLMChatOptions,
  ): Promise<{
    content: string | null;
    toolCalls: ToolCallResult[] | null;
  }> {
    const text = await this.generateChat(messages, options);
    return { content: text, toolCalls: null };
  }
}
