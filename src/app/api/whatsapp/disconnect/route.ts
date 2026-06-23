import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { disconnectInstance, deleteInstance } from "@/lib/whatsapp/client";
import { revalidatePath } from "next/cache";

export async function POST() {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const barber = await prisma.barber.findUnique({ where: { id: user.id } });
  if (!barber?.evolutionInstance) {
    return NextResponse.json({ error: "No instance" }, { status: 400 });
  }

  try {
    await disconnectInstance(barber.evolutionInstance);
  } catch {
    // Ignore disconnect errors
  }

  try {
    await deleteInstance(barber.evolutionInstance);
  } catch {
    // Ignore delete errors
  }

  await prisma.barber.update({
    where: { id: barber.id },
    data: {
      evolutionInstance: null,
      evolutionApiKey: null,
      evolutionApiUrl: null,
      whatsappConnected: false,
    },
  });

  revalidatePath("/barber");
  revalidatePath("/barber/whatsapp");

  return NextResponse.json({ success: true });
}
