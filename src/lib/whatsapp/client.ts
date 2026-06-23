const BASE_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const API_KEY = process.env.EVOLUTION_API_KEY || "wapoint_master_key";

const headers = {
  "Content-Type": "application/json",
  apikey: API_KEY,
};

async function request<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution API error ${res.status}: ${text}`);
  }

  return res.json();
}

export interface InstanceCreateResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  qrcode: {
    pairingCode?: string;
    base64: string;
  };
  hash?: string;
}

export interface ConnectionStateResponse {
  state: string;
  status: string;
}

export async function createInstance(
  instanceName: string,
): Promise<InstanceCreateResponse> {
  return request<InstanceCreateResponse>("POST", "/instance/create", {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    token: instanceName,
  });
}

export async function getQRCode(
  instanceName: string,
): Promise<{ base64: string; code?: string }> {
  return request<{ base64: string; code?: string }>(
    "GET",
    `/instance/qrcode/${instanceName}?isBase64=true`,
  );
}

export async function getConnectionState(
  instanceName: string,
): Promise<ConnectionStateResponse> {
  return request<ConnectionStateResponse>(
    "GET",
    `/instance/connectionState/${instanceName}`,
  );
}

export async function disconnectInstance(instanceName: string): Promise<void> {
  await request("DELETE", `/instance/logout/${instanceName}`);
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await request("DELETE", `/instance/delete/${instanceName}`);
}

export async function sendTextMessage(
  instanceName: string,
  to: string,
  text: string,
): Promise<void> {
  const phone = to.replace(/\D/g, "");
  await request("POST", `/message/send/${instanceName}`, {
    number: phone,
    text,
  });
}

export async function setWebhook(
  instanceName: string,
  webhookUrl: string,
): Promise<void> {
  await request("POST", `/instance/setWebhook/${instanceName}`, {
    webhookUrl,
    webhookBase64: false,
    events: ["messages.upsert"],
  });
}
