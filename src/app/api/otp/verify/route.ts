import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/whatsapp/otp";

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  if (!phone || !code) {
    return NextResponse.json(
      { error: "phone and code are required" },
      { status: 400 },
    );
  }

  const valid = await verifyOTP(phone, code);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 },
    );
  }

  return NextResponse.json({ verified: true });
}
