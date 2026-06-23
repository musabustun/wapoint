import { LLMTool } from "./types";

function param(
  type: string,
  description: string,
  optional = false,
): Record<string, unknown> {
  return { type, description, ...(optional ? {} : {}) };
}

export function getServiceTools(barberName: string): LLMTool[] {
  return [
    {
      type: "function",
      function: {
        name: "get_services",
        description: `List ${barberName}'s available services with prices and durations`,
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_available_slots",
        description: `Check available appointment times for ${barberName} on a specific date`,
        parameters: {
          type: "object",
          properties: {
            date: param("string", "Date in YYYY-MM-DD format"),
            serviceName: param(
              "string",
              "Optional service name to filter slots by duration",
              true,
            ),
          },
          required: ["date"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: `Book an appointment with ${barberName}`,
        parameters: {
          type: "object",
          properties: {
            customerName: param("string", "Customer's full name"),
            customerPhone: param("string", "Customer's phone number with country code, e.g. 905551234567"),
            date: param("string", "Appointment date in YYYY-MM-DD format"),
            time: param("string", "Appointment time in HH:MM format (24h)"),
            serviceName: param("string", "Name of the service to book", true),
          },
          required: ["customerName", "customerPhone", "date", "time"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_customer_appointments",
        description: "Check a customer's existing appointments by phone number",
        parameters: {
          type: "object",
          properties: {
            phone: param("string", "Customer's phone number"),
          },
          required: ["phone"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "cancel_appointment",
        description: "Cancel an appointment by its ID",
        parameters: {
          type: "object",
          properties: {
            appointmentId: param("string", "Appointment ID to cancel"),
          },
          required: ["appointmentId"],
        },
      },
    },
  ];
}
