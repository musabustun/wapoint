import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWhatsAppMessage } from "@/lib/llm/booking-agent";
import { sendTextMessage } from "@/lib/whatsapp/client";

interface WebhookEvent {
  event: string;
  instance: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
      imageMessage?: unknown;
      [key: string]: unknown;
    };
    pushName?: string;
  };
}

export async function POST(req: Request) {
  const body: WebhookEvent = await req.json();

  if (body.event !== "messages.upsert") {
    return NextResponse.json({ ok: true });
  }

  const instanceName = body.instance;
  const msgData = body.data;

  if (!msgData?.key?.remoteJid || msgData.key.fromMe) {
    return NextResponse.json({ ok: true });
  }

  const messageText =
    msgData.message?.conversation ||
    msgData.message?.extendedTextMessage?.text ||
    "";

  if (!messageText.trim()) {
    return NextResponse.json({ ok: true });
  }

  const barber = await prisma.barber.findFirst({
    where: { evolutionInstance: instanceName },
  });

  if (!barber) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  const remoteJid = msgData.key.remoteJid;
  const customerPhone = remoteJid.replace(/@s\.whatsapp\.net$/, "");

  try {
    if (messageText.toLowerCase().startsWith("/yardim")) {
      await sendTextMessage(instanceName, remoteJid, getHelpText(barber.name));
      return NextResponse.json({ ok: true });
    }

    const reply = await processWhatsAppMessage(barber.slug, customerPhone, messageText);
    await sendTextMessage(instanceName, remoteJid, reply);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[WhatsApp Webhook] Error: ${errorMsg}`);
    await sendTextMessage(
      instanceName,
      remoteJid,
      "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    );
  }

  return NextResponse.json({ ok: true });
}

function getHelpText(barberName: string): string {
  return `Merhaba! Ben ${barberName} AI asistanıyım. Size yardımcı olabilmem için şunları yapabilirim:

📋 *Hizmetler* - "Hizmetleriniz neler?" yazın
📅 *Randevu* - "Yarın 14:00'a randevu alabilir miyim?" yazın
🔍 *Sorgulama* - "Randevularımı göster" yazın
❌ *İptal* - "Randevumu iptal et" yazın

Size doğal dilde yardımcı olabilirim!`;
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "waPoint WhatsApp Webhook",
  });
}
