import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function deleteBarber(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.barber.update({
    where: { id },
    data: { isActive: false },
  });
}

export default async function SuperAdminDashboard() {
  const barbers = await prisma.barber.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  });

  const totalAppointments = barbers.reduce(
    (sum, b) => sum + b._count.appointments,
    0,
  );
  const activeBarbers = barbers.filter((b) => b.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Barbers</h1>
          <p className="text-zinc-400 mt-1">
            Manage all barber accounts
          </p>
        </div>
        <Link href="/super-admin/barbers/new">
          <Button className="bg-white text-zinc-900 hover:bg-zinc-200">
            Add Barber
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{activeBarbers}</CardTitle>
            <CardDescription>Active Barbers</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {barbers.length - activeBarbers}
            </CardTitle>
            <CardDescription>Suspended</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {totalAppointments}
            </CardTitle>
            <CardDescription>Total Appointments</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>All Barbers</CardTitle>
          <CardDescription>
            {barbers.length} barber{barbers.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-950"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-semibold">
                    {barber.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {barber.name}
                      </span>
                      {barber.whatsappConnected && (
                        <Badge
                          variant="outline"
                          className="text-green-400 border-green-800"
                        >
                          WhatsApp
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">
                      {barber.email} · /{barber.slug} ·{" "}
                      {barber._count.appointments} appointment
                      {barber._count.appointments !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      barber.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <Link href={`/super-admin/barbers/${barber.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-white"
                    >
                      Edit
                    </Button>
                  </Link>
                  {barber.isActive && (
                    <form action={deleteBarber}>
                      <input type="hidden" name="id" value={barber.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950"
                      >
                        Suspend
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
            {barbers.length === 0 && (
              <p className="text-center text-zinc-500 py-8">
                No barbers yet. Create your first barber account.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
