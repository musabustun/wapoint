import { redis } from "../redis";
import { sendTextMessage } from "./client";

const OTP_PREFIX = "otp:";
const OTP_TTL = 300;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOTP(
  instanceName: string,
  phone: string,
  barberName: string,
): Promise<void> {
  const code = generateCode();
  const key = `${OTP_PREFIX}${phone}`;

  await redis.set(key, code, "EX", OTP_TTL);

  const message = `Merhaba! ${barberName} randevu onay kodunuz: ${code}\n\nBu kod 5 dakika geçerlidir.`;
  await sendTextMessage(instanceName, phone, message);
}

export async function verifyOTP(
  phone: string,
  code: string,
): Promise<boolean> {
  const key = `${OTP_PREFIX}${phone}`;
  const stored = await redis.get(key);

  if (!stored) return false;
  if (stored !== code) return false;

  await redis.del(key);
  return true;
}

export async function getOTPStatus(phone: string): Promise<boolean> {
  const exists = await redis.exists(`${OTP_PREFIX}${phone}`);
  return exists === 1;
}
