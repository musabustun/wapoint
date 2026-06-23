import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const barber = await prisma.barber.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true },
  });

  if (!barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  const services = await prisma.service.findMany({
    where: { barberId: barber.id, isActive: true },
    select: { id: true, name: true, duration: true, price: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ barber, services });
}
