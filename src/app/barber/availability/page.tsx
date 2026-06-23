import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_NAMES_TR = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

async function saveAvailability(formData: FormData) {
  "use server";

  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return;

  const barberId = user.id;

  await prisma.availability.deleteMany({ where: { barberId } });

  for (let day = 0; day < 7; day++) {
    const enabled = formData.get(`day-${day}-enabled`) === "on";
    if (!enabled) continue;

    const startTime = formData.get(`day-${day}-start`) as string;
    const endTime = formData.get(`day-${day}-end`) as string;

    if (startTime && endTime) {
      await prisma.availability.create({
        data: {
          barberId,
          dayOfWeek: day,
          startMin: timeToMin(startTime),
          endMin: timeToMin(endTime),
          isActive: true,
        },
      });
    }
  }

  revalidatePath("/barber/availability");
}

export default async function AvailabilityPage() {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return <p className="text-zinc-400">Please log in</p>;

  const availabilities = await prisma.availability.findMany({
    where: { barberId: user.id },
  });

  const availabilityMap = new Map<number, { startMin: number; endMin: number }>();
  for (const a of availabilities) {
    availabilityMap.set(a.dayOfWeek, { startMin: a.startMin, endMin: a.endMin });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Working Hours</h1>
        <p className="text-zinc-400 mt-1">
          Set your weekly schedule. Customers can only book during these hours.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Configure your available days and hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveAvailability} className="space-y-6">
            {DAY_NAMES.map((dayEn, day) => {
              const existing = availabilityMap.get(day);
              const enabled = !!existing;
              const startTime = existing ? minToTime(existing.startMin) : "09:00";
              const endTime = existing ? minToTime(existing.endMin) : "18:00";

              return (
                <div
                  key={day}
                  className="flex items-center gap-4 pb-4 border-b border-zinc-800 last:border-0"
                >
                  <div className="w-28">
                    <Label className="text-zinc-300 text-sm cursor-pointer">
                      {DAY_NAMES_TR[day]}
                    </Label>
                    <p className="text-xs text-zinc-600">{dayEn}</p>
                  </div>

                  <input
                    type="hidden"
                    name={`day-${day}-enabled`}
                    value="off"
                  />
                  <Switch
                    name={`day-${day}-enabled`}
                    defaultChecked={enabled}
                  />

                  <div className="flex items-center gap-2 ml-2">
                    <Input
                      name={`day-${day}-start`}
                      type="time"
                      defaultValue={startTime}
                      className="border-zinc-700 bg-zinc-800 text-white w-28"
                    />
                    <span className="text-zinc-500">to</span>
                    <Input
                      name={`day-${day}-end`}
                      type="time"
                      defaultValue={endTime}
                      className="border-zinc-700 bg-zinc-800 text-white w-28"
                    />
                  </div>
                </div>
              );
            })}

            <Button
              type="submit"
              className="bg-white text-zinc-900 hover:bg-zinc-200"
            >
              Save Schedule
            </Button>
          </form>
        </CardContent>
      </Card>

      {availabilities.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Current Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {Array.from({ length: 7 }, (_, day) => {
                const a = availabilityMap.get(day);
                if (!a) return null;
                return (
                  <div key={day} className="flex justify-between text-zinc-400">
                    <span className="text-white font-medium">{DAY_NAMES_TR[day]}</span>
                    <span>
                      {minToTime(a.startMin)} – {minToTime(a.endMin)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
