import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function updateBarber(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const slug = formData.get("slug") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const requireOtp = formData.get("requireOtp") === "on";
  const isActive = formData.get("isActive") === "on";

  await prisma.barber.update({
    where: { id },
    data: { name, email, slug, phone: phone || null, address: address || null, requireOtp, isActive },
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/barbers/${id}`);
  redirect("/super-admin");
}

export default async function EditBarberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const barber = await prisma.barber.findUnique({ where: { id } });

  if (!barber) notFound();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Barber</h1>
        <p className="text-zinc-400 mt-1">{barber.name}</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Modify barber account settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateBarber} className="space-y-4">
            <input type="hidden" name="id" value={barber.id} />

            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">
                Barber Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={barber.name}
                className="border-zinc-700 bg-zinc-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={barber.email}
                className="border-zinc-700 bg-zinc-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-300">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={barber.phone ?? ""}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-zinc-300">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={barber.address ?? ""}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-zinc-300">
                Slug
              </Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={barber.slug}
                className="border-zinc-700 bg-zinc-800 text-white"
                required
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="requireOtp"
                name="requireOtp"
                defaultChecked={barber.requireOtp}
              />
              <Label htmlFor="requireOtp" className="text-zinc-300">
                Require WhatsApp OTP for web bookings
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={barber.isActive}
              />
              <Label htmlFor="isActive" className="text-zinc-300">
                Account Active
              </Label>
            </div>
            {barber.whatsappConnected && (
              <div className="p-3 rounded-lg bg-green-950/50 border border-green-800">
                <p className="text-sm text-green-400">
                  WhatsApp connected via instance: {barber.evolutionInstance}
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="bg-white text-zinc-900 hover:bg-zinc-200"
              >
                Save Changes
              </Button>
              <Link
                href="/super-admin"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-clip-padding px-4 py-2 text-sm font-medium text-zinc-400 transition-all outline-none select-none hover:text-white"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
