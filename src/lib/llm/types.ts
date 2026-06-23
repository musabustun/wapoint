export type LLMProviderType = "openai" | "google" | "openrouter" | "groq";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
}

export interface LLMTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ToolCallResult {
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMProvider {
  generateChat(
    messages: LLMMessage[],
    options?: LLMChatOptions,
  ): Promise<string>;
  generateWithTools(
    messages: LLMMessage[],
    tools: LLMTool[],
    options?: LLMChatOptions,
  ): Promise<{
    content: string | null;
    toolCalls: ToolCallResult[] | null;
  }>;
}

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
}
