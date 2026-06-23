import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const serviceId = url.searchParams.get("serviceId") || undefined;

  if (!date) {
    return NextResponse.json(
      { error: "date parameter is required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const result = await getAvailableSlots(slug, date, serviceId);

  if (!result.barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
