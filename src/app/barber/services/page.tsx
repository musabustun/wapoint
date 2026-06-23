import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scissors, Pencil, Trash2 } from "lucide-react";

async function addService(formData: FormData) {
  "use server";

  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return;

  const name = formData.get("name") as string;
  const duration = parseInt(formData.get("duration") as string);
  const price = parseFloat(formData.get("price") as string);

  await prisma.service.create({
    data: {
      barberId: user.id,
      name,
      duration,
      price,
    },
  });

  revalidatePath("/barber/services");
}

async function updateService(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const duration = parseInt(formData.get("duration") as string);
  const price = parseFloat(formData.get("price") as string);

  await prisma.service.update({
    where: { id },
    data: { name, duration, price },
  });

  revalidatePath("/barber/services");
}

async function deleteService(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  await prisma.service.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/barber/services");
}

export default async function ServicesPage() {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return <p className="text-zinc-400">Please log in</p>;

  const services = await prisma.service.findMany({
    where: { barberId: user.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Services</h1>
        <p className="text-zinc-400 mt-1">
          Manage the services you offer to customers
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Add Service</CardTitle>
          <CardDescription>Define a new service with duration and price</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addService} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Service Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Haircut, Beard Trim, Hair Dye"
                className="border-zinc-700 bg-zinc-800 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-zinc-300">Duration (min)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min={15}
                  step={5}
                  defaultValue={30}
                  className="border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-zinc-300">Price (TL)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step={0.5}
                  defaultValue={150}
                  className="border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="bg-white text-zinc-900 hover:bg-zinc-200">
              Add Service
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {services.map((service) => (
          <Card key={service.id} className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-4">
              <form action={updateService} className="flex items-center gap-4">
                <input type="hidden" name="id" value={service.id} />
                <Scissors className="w-5 h-5 text-zinc-500 shrink-0" />
                <Input
                  name="name"
                  defaultValue={service.name}
                  className="border-zinc-700 bg-zinc-800 text-white flex-1"
                  required
                />
                <div className="flex items-center gap-2">
                  <Input
                    name="duration"
                    type="number"
                    defaultValue={service.duration}
                    min={15}
                    step={5}
                    className="border-zinc-700 bg-zinc-800 text-white w-20 text-center"
                    required
                  />
                  <span className="text-sm text-zinc-500 w-12">min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    name="price"
                    type="number"
                    defaultValue={Number(service.price)}
                    min={0}
                    step={0.5}
                    className="border-zinc-700 bg-zinc-800 text-white w-24 text-center"
                    required
                  />
                  <span className="text-sm text-zinc-500 w-8">TL</span>
                </div>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </form>
              <form action={deleteService} className="mt-2 flex justify-end">
                <input type="hidden" name="id" value={service.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-950 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
        {services.length === 0 && (
          <p className="text-center text-zinc-500 py-8">
            No services yet. Add your first service above.
          </p>
        )}
      </div>
    </div>
  );
}
