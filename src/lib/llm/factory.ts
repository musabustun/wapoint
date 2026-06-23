import { LLMProvider, LLMProviderType, LLMProviderConfig } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GoogleProvider } from "./providers/google";
import { OpenRouterProvider } from "./providers/openrouter";
import { GroqProvider } from "./providers/groq";
import { prisma } from "../prisma";
import { decrypt } from "../crypto";

const providerModelDefaults: Record<LLMProviderType, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-1.5-flash",
  openrouter: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
};

function getEncryptedKey(
  settings: NonNullable<Awaited<ReturnType<typeof prisma.superAdminSettings.findFirst>>>,
  provider: LLMProviderType,
): string | null {
  switch (provider) {
    case "openai":
      return settings.openaiApiKey;
    case "google":
      return settings.googleApiKey;
    case "openrouter":
      return settings.openrouterKey;
    case "groq":
      return settings.groqApiKey;
  }
}

export async function getProviderConfig(): Promise<LLMProviderConfig> {
  const settings = await prisma.superAdminSettings.findFirst();

  const provider: LLMProviderType =
    (settings?.llmProvider as LLMProviderType) ?? "openai";
  const model = settings?.llmModel ?? providerModelDefaults[provider];
  const encryptedKey = settings ? getEncryptedKey(settings, provider) : null;

  if (!encryptedKey) {
    throw new Error(
      `API key not configured for provider: ${provider}. Go to Super Admin > Settings to configure.`,
    );
  }

  const apiKey = decrypt(encryptedKey);
  return { apiKey, model };
}

export async function createProvider(): Promise<LLMProvider> {
  const config = await getProviderConfig();
  const settings = await prisma.superAdminSettings.findFirst();
  const provider: LLMProviderType =
    (settings?.llmProvider as LLMProviderType) ?? "openai";

  return createProviderFromConfig(provider, config);
}

export function createProviderFromConfig(
  provider: LLMProviderType,
  config: LLMProviderConfig,
): LLMProvider {
  switch (provider) {
    case "openai":
      return new OpenAIProvider(config.apiKey, config.model);
    case "google":
      return new GoogleProvider(config.apiKey, config.model);
    case "openrouter":
      return new OpenRouterProvider(config.apiKey, config.model);
    case "groq":
      return new GroqProvider(config.apiKey, config.model);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}
