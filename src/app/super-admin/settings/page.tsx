import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { encrypt, decrypt } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const providers = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] },
  { value: "google", label: "Google Gemini", models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"] },
  { value: "openrouter", label: "OpenRouter", models: ["gpt-4o-mini", "claude-3.5-sonnet", "gemini-1.5-flash"] },
  { value: "groq", label: "Groq", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"] },
];

async function saveSettings(formData: FormData) {
  "use server";

  const provider = formData.get("provider") as string;
  const model = formData.get("model") as string;

  const rawKeys = {
    openaiApiKey: formData.get("openaiApiKey") as string,
    googleApiKey: formData.get("googleApiKey") as string,
    openrouterKey: formData.get("openrouterKey") as string,
    groqApiKey: formData.get("groqApiKey") as string,
  };

  const existing = await prisma.superAdminSettings.findFirst();

  const data: Record<string, string> = {
    llmProvider: provider,
    llmModel: model,
  };

  for (const [field, value] of Object.entries(rawKeys)) {
    if (value) {
      data[field] = encrypt(value);
    }
  }

  if (existing) {
    await prisma.superAdminSettings.update({
      where: { id: existing.id },
      data: data as any,
    });
  } else {
    await prisma.superAdminSettings.create({
      data: data as any,
    });
  }

  revalidatePath("/super-admin/settings");
  redirect("/super-admin/settings");
}

export default async function SettingsPage() {
  const settings = await prisma.superAdminSettings.findFirst();

  const currentKeys: Record<string, string> = {};
  if (settings) {
    for (const field of ["openaiApiKey", "googleApiKey", "openrouterKey", "groqApiKey"] as const) {
      const val = settings[field];
      currentKeys[field] = val ? "••••••••" + decrypt(val).slice(-4) : "";
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">LLM Settings</h1>
        <p className="text-zinc-400 mt-1">
          Configure the AI provider for WhatsApp booking assistant
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>
            All barbers' WhatsApp AI assistants will use this provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSettings} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-zinc-300">AI Provider</Label>
              <Select name="provider" defaultValue={settings?.llmProvider ?? "openai"}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-white">
                  {providers.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Model</Label>
              <Select name="model" defaultValue={settings?.llmModel ?? "gpt-4o-mini"}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-white">
                  {providers.flatMap((p) =>
                    p.models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    )),
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500">
                Choose the model that will power the WhatsApp AI assistant
              </p>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">
                API Keys
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">OpenAI API Key</Label>
                  <Input
                    name="openaiApiKey"
                    type="password"
                    placeholder={currentKeys.openaiApiKey || "sk-..."}
                    className="border-zinc-700 bg-zinc-800 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Google Gemini API Key</Label>
                  <Input
                    name="googleApiKey"
                    type="password"
                    placeholder={currentKeys.googleApiKey || "AIza..."}
                    className="border-zinc-700 bg-zinc-800 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">OpenRouter API Key</Label>
                  <Input
                    name="openrouterKey"
                    type="password"
                    placeholder={currentKeys.openrouterKey || "sk-or-..."}
                    className="border-zinc-700 bg-zinc-800 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Groq API Key</Label>
                  <Input
                    name="groqApiKey"
                    type="password"
                    placeholder={currentKeys.groqApiKey || "gsk_..."}
                    className="border-zinc-700 bg-zinc-800 text-white font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Keys are encrypted at rest. Leave blank to keep existing.
              </p>
            </div>

            <Button
              type="submit"
              className="bg-white text-zinc-900 hover:bg-zinc-200"
            >
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
