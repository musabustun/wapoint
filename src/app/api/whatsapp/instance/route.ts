import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  createInstance,
  getConnectionState,
  getQRCode,
} from "@/lib/whatsapp/client";

export async function POST() {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const barber = await prisma.barber.findUnique({ where: { id: user.id } });
  if (!barber) return NextResponse.json({ error: "Barber not found" }, { status: 404 });

  if (barber.whatsappConnected) {
    return NextResponse.json({ error: "Already connected" }, { status: 400 });
  }

  const instanceName = `barber_${barber.slug}_${Date.now()}`;

  try {
    const result = await createInstance(instanceName);

    await prisma.barber.update({
      where: { id: barber.id },
      data: {
        evolutionInstance: instanceName,
        evolutionApiUrl: process.env.EVOLUTION_API_URL || "http://localhost:8080",
        evolutionApiKey: instanceName,
      },
    });

    return NextResponse.json({
      instanceName,
      qrcode: result.qrcode.base64,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create instance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const barber = await prisma.barber.findUnique({ where: { id: user.id } });
  if (!barber || !barber.evolutionInstance) {
    return NextResponse.json({ connected: false });
  }

  try {
    const state = await getConnectionState(barber.evolutionInstance);
    const isConnected = state.state === "open";

    if (isConnected && !barber.whatsappConnected) {
      await prisma.barber.update({
        where: { id: barber.id },
        data: { whatsappConnected: true },
      });
    }

    if (!isConnected && barber.whatsappConnected) {
      await prisma.barber.update({
        where: { id: barber.id },
        data: { whatsappConnected: false },
      });
    }

    return NextResponse.json({
      connected: isConnected,
      instanceName: barber.evolutionInstance,
      state: state.state,
    });
  } catch {
    return NextResponse.json({ connected: false, instanceName: barber.evolutionInstance });
  }
}
