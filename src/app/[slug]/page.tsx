import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingWidget } from "./booking-widget";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const barber = await prisma.barber.findUnique({
    where: { slug, isActive: true },
  });
  if (!barber) return { title: "Not Found" };

  return {
    title: `${barber.name} - Online Randevu`,
    description: `${barber.name} için online randevu alın.`,
  };
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;

  const barber = await prisma.barber.findUnique({
    where: { slug, isActive: true },
    include: {
      services: { where: { isActive: true }, orderBy: { name: "asc" } },
      availabilities: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!barber) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">{barber.name}</h1>
        </div>

        <BookingWidget
          barberSlug={barber.slug}
          barberName={barber.name}
          services={barber.services.map((s) => ({
            id: s.id,
            name: s.name,
            duration: s.duration,
            price: Number(s.price),
          }))}
          availability={barber.availabilities.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startMin: a.startMin,
            endMin: a.endMin,
          }))}
          requireOtp={barber.requireOtp}
        />
      </div>
    </div>
  );
}
