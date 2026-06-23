import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function createBarber(formData: FormData) {
  "use server";

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const slug = formData.get("slug") as string || generateSlug(name);
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const requireOtp = formData.get("requireOtp") === "on";

  const passwordHash = await hash(password, 12);

  await prisma.barber.create({
    data: {
      name,
      email,
      passwordHash,
      slug,
      phone: phone || null,
      address: address || null,
      requireOtp,
    },
  });

  revalidatePath("/super-admin");
  redirect("/super-admin");
}

export default function NewBarberPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">New Barber</h1>
        <p className="text-zinc-400 mt-1">Create a new barber account</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            The barber will use these credentials to log in to their dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createBarber} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">
                Barber Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Berber Ahmet"
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
                placeholder="ahmet@berber.com"
                className="border-zinc-700 bg-zinc-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min 6 characters"
                className="border-zinc-700 bg-zinc-800 text-white"
                minLength={6}
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
                placeholder="05XX XXX XX XX"
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
                placeholder="Shop address"
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-zinc-300">
                Slug (URL)
              </Label>
              <Input
                id="slug"
                name="slug"
                placeholder="berber-ahmet"
                className="border-zinc-700 bg-zinc-800 text-white"
              />
              <p className="text-xs text-zinc-500">
                Auto-generated from name if left empty. Customers will book via:
                yourdomain.com/<strong className="text-zinc-400">slug</strong>
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch id="requireOtp" name="requireOtp" defaultChecked />
              <Label htmlFor="requireOtp" className="text-zinc-300">
                Require WhatsApp OTP for web bookings
              </Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="bg-white text-zinc-900 hover:bg-zinc-200"
              >
                Create Barber
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-400"
                onClick={() => redirect("/super-admin")}
                type="button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
