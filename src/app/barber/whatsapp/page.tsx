import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhatsAppConnect } from "@/components/shared/whatsapp-connect";
import { createInstance, disconnectInstance, deleteInstance, setWebhook } from "@/lib/whatsapp/client";

async function startConnection() {
  "use server";
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return;

  const barber = await prisma.barber.findUnique({ where: { id: user.id } });
  if (!barber) return;

  if (barber.evolutionInstance) return;

  const instanceName = `barber_${barber.slug}_${Date.now()}`;
  try {
    await createInstance(instanceName);
  } catch {
    // instance may already exist
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whatsapp/webhook`;
  try {
    await setWebhook(instanceName, webhookUrl);
  } catch {
    // webhook setting is optional
  }

  await prisma.barber.update({
    where: { id: user.id },
    data: {
      evolutionInstance: instanceName,
      evolutionApiKey: instanceName,
      evolutionApiUrl: process.env.EVOLUTION_API_URL || "http://localhost:8080",
    },
  });

  revalidatePath("/barber/whatsapp");
  redirect("/barber/whatsapp");
}

async function disconnect() {
  "use server";
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return;

  const barber = await prisma.barber.findUnique({ where: { id: user.id } });
  if (!barber?.evolutionInstance) return;

  try {
    await disconnectInstance(barber.evolutionInstance);
  } catch {
    /* ignore */
  }
  try {
    await deleteInstance(barber.evolutionInstance);
  } catch {
    /* ignore */
  }

  await prisma.barber.update({
    where: { id: user.id },
    data: {
      evolutionInstance: null,
      evolutionApiKey: null,
      evolutionApiUrl: null,
      whatsappConnected: false,
    },
  });

  revalidatePath("/barber/whatsapp");
  redirect("/barber/whatsapp");
}

export default async function WhatsAppPage() {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return <p className="text-zinc-400">Please log in</p>;

  const barber = await prisma.barber.findUnique({ where: { id: user.id } });
  if (!barber) return <p className="text-zinc-400">Barber not found</p>;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">WhatsApp Integration</h1>
        <p className="text-zinc-400 mt-1">
          Connect your WhatsApp to enable AI booking and OTP verification
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            {barber.whatsappConnected
              ? "Your WhatsApp is connected and ready"
              : "Scan the QR code with your WhatsApp to connect"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WhatsAppConnect
            instanceName={barber.evolutionInstance}
            alreadyConnected={barber.whatsappConnected}
          />

          {!barber.evolutionInstance && (
            <div className="text-center mt-6">
              <form action={startConnection}>
                <Button className="bg-white text-zinc-900 hover:bg-zinc-200">
                  Start Connection
                </Button>
              </form>
            </div>
          )}

          {barber.evolutionInstance && (
            <div className="mt-6">
              <form action={disconnect}>
                <Button
                  variant="outline"
                  className="border-red-800 text-red-400 hover:bg-red-950 w-full"
                >
                  Disconnect &amp; Remove Instance
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
