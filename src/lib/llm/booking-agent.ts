import { prisma } from "../prisma";
import { LLMMessage, LLMTool } from "./types";
import { createProviderFromConfig, getProviderConfig } from "./factory";
import { getServiceTools } from "./functions";
import { addMinutes, parseISO, startOfDay } from "date-fns";
import { minToTime } from "../slots";

interface ExecutionContext {
  barberId: string;
  barberSlug: string;
  barberName: string;
  customerPhone: string;
}

async function getServices(ctx: ExecutionContext) {
  const services = await prisma.service.findMany({
    where: { barberId: ctx.barberId, isActive: true },
    orderBy: { name: "asc" },
  });
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
  }));
}

async function getAvailableSlotsFn(ctx: ExecutionContext, args: Record<string, unknown>) {
  const date = args.date as string;
  const serviceName = args.serviceName as string | undefined;

  const targetDate = parseISO(date);
  const dayOfWeek = targetDate.getDay();

  const avail = await prisma.availability.findFirst({
    where: { barberId: ctx.barberId, dayOfWeek, isActive: true },
  });

  if (!avail) {
    return { available: false, message: `${ctx.barberName} is not available on this date.` };
  }

  let services = await prisma.service.findMany({
    where: { barberId: ctx.barberId, isActive: true },
    orderBy: { name: "asc" },
  });

  if (serviceName) {
    services = services.filter((s) =>
      s.name.toLowerCase().includes(serviceName.toLowerCase()),
    );
  }

  if (services.length === 0) {
    return { available: false, message: "No matching service found." };
  }

  const dayStart = startOfDay(targetDate);
  const workStart = addMinutes(dayStart, avail.startMin);
  const workEnd = addMinutes(dayStart, avail.endMin);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      barberId: ctx.barberId,
      status: "ONAYLANDI",
      startTime: { gte: dayStart, lt: addMinutes(dayStart, 1440) },
    },
    select: { startTime: true, endTime: true },
  });

  const now = new Date();

  const results = services.map((service) => {
    const times: string[] = [];
    let cursor = workStart;

    while (cursor < workEnd) {
      const slotEnd = addMinutes(cursor, service.duration);
      if (slotEnd > workEnd) break;

      const isInPast = cursor < now;
      const isBooked = existingAppointments.some((apt) =>
        cursor < apt.endTime && slotEnd > apt.startTime,
      );

      if (!isInPast && !isBooked) {
        times.push(minToTime(cursor.getHours() * 60 + cursor.getMinutes()));
      }

      cursor = addMinutes(cursor, service.duration);
    }

    return {
      serviceName: service.name,
      duration: service.duration,
      price: Number(service.price),
      availableTimes: times,
    };
  });

  return {
    date,
    barber: ctx.barberName,
    slots: results,
  };
}

async function bookAppointment(ctx: ExecutionContext, args: Record<string, unknown>) {
  const { customerName, customerPhone, date, time, serviceName } = args as Record<string, string>;

  const phone = customerPhone.replace(/\D/g, "");

  let service = null;
  if (serviceName) {
    service = await prisma.service.findFirst({
      where: { barberId: ctx.barberId, name: { contains: serviceName, mode: "insensitive" }, isActive: true },
    });
  }

  const duration = service?.duration ?? 30;

  const [h, m] = time.split(":").map(Number);
  const startTime = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const endTime = addMinutes(startTime, duration);

  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId: ctx.barberId,
      status: "ONAYLANDI",
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflict) {
    return {
      success: false,
      message: "This time slot is no longer available. Please choose another time.",
    };
  }

  if (startTime < new Date()) {
    return {
      success: false,
      message: "Cannot book an appointment in the past.",
    };
  }

  const appointment = await prisma.appointment.create({
    data: {
      barberId: ctx.barberId,
      serviceId: service?.id ?? null,
      customerName,
      customerPhone: phone,
      startTime,
      endTime,
      source: "WHATSAPP",
      status: "ONAYLANDI",
    },
  });

  return {
    success: true,
    appointment: {
      id: appointment.id,
      customerName,
      date,
      time,
      service: service?.name ?? "Standart",
      duration,
    },
  };
}

async function getCustomerAppointments(ctx: ExecutionContext, args: Record<string, unknown>) {
  const phone = (args.phone as string).replace(/\D/g, "");

  const appointments = await prisma.appointment.findMany({
    where: { barberId: ctx.barberId, customerPhone: phone },
    include: { service: { select: { name: true } } },
    orderBy: { startTime: "desc" },
    take: 10,
  });

  return appointments.map((a) => ({
    id: a.id,
    customerName: a.customerName,
    date: a.startTime.toISOString().split("T")[0],
    time: `${String(a.startTime.getHours()).padStart(2, "0")}:${String(a.startTime.getMinutes()).padStart(2, "0")}`,
    service: a.service?.name ?? "Standart",
    status: a.status,
  }));
}

async function cancelAppointmentFn(ctx: ExecutionContext, args: Record<string, unknown>) {
  const appointmentId = args.appointmentId as string;

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, barberId: ctx.barberId },
  });

  if (!appointment) {
    return { success: false, message: "Appointment not found." };
  }

  if (appointment.status === "IPTAL") {
    return { success: false, message: "Appointment is already cancelled." };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "IPTAL" },
  });

  return {
    success: true,
    message: `Appointment on ${appointment.startTime.toISOString().split("T")[0]} has been cancelled.`,
  };
}

const functionMap: Record<string, (ctx: ExecutionContext, args: Record<string, unknown>) => Promise<unknown>> = {
  get_services: getServices,
  get_available_slots: getAvailableSlotsFn,
  book_appointment: bookAppointment,
  get_customer_appointments: getCustomerAppointments,
  cancel_appointment: cancelAppointmentFn,
};

function buildSystemPrompt(barberName: string): string {
  return `Sen ${barberName} kuaför salonunun AI randevu asistanısın. Türkçe konuşuyorsun, samimi ve yardımseversin.

Yapabileceklerin:
- Hizmet listesini gösterme (get_services)
- Müsait randevu saatlerini sorgulama (get_available_slots)
- Randevu alma (book_appointment)
- Mevcut randevuları sorgulama (get_customer_appointments)
- Randevu iptal etme (cancel_appointment)

Kullanıcı mesajını anlayıp uygun fonksiyonu çağır. Eğer kullanıcının ne istediği net değilse, anlamak için soru sor.
Telefon numarası isterken uluslararası formatta iste (başında 0 olmadan, örn: 905551234567).
Tarih isterken YYYY-AA-GG formatında iste.
Saat isterken HH:MM formatında (24 saat) iste.
Hizmet ismi sorarken opsiyonel olarak sor.`;
}

export async function processWhatsAppMessage(
  barberSlug: string,
  customerPhone: string,
  messageText: string,
): Promise<string> {
  const barber = await prisma.barber.findUnique({
    where: { slug: barberSlug, isActive: true },
  });

  if (!barber) return "Üzgünüm, bu berber bulunamadı.";

  const ctx: ExecutionContext = {
    barberId: barber.id,
    barberSlug: barber.slug,
    barberName: barber.name,
    customerPhone,
  };

  const config = await getProviderConfig();
  const provider = createProviderFromConfig(
    (await prisma.superAdminSettings.findFirst())?.llmProvider as any ?? "openai",
    config,
  );

  const tools = getServiceTools(barber.name);
  const systemPrompt = buildSystemPrompt(barber.name);

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: messageText },
  ];

  const MAX_ROUNDS = 5;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const result = await provider.generateWithTools(messages, tools);

    if (result.toolCalls && result.toolCalls.length > 0) {
      if (result.content) {
        messages.push({ role: "assistant", content: result.content });
      }

      for (const tc of result.toolCalls) {
        const fn = functionMap[tc.name];
        if (!fn) {
          messages.push({
            role: "tool",
            content: JSON.stringify({ error: `Unknown function: ${tc.name}` }),
            tool_call_id: tc.name,
          });
          continue;
        }

        try {
          const fnResult = await fn(ctx, tc.arguments);
          messages.push({
            role: "tool",
            content: JSON.stringify(fnResult),
            tool_call_id: tc.name,
          });
        } catch (err) {
          messages.push({
            role: "tool",
            content: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
            tool_call_id: tc.name,
          });
        }
      }
    } else {
      return result.content ?? "Bir şey anlamadım. Lütfen tekrar dener misiniz?";
    }
  }

  return "Çok fazla işlem yapmaya çalıştınız. Lütfen baştan başlayın.";
}
