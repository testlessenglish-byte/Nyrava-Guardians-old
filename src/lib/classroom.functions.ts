import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const chatSchema = z.object({
  guardian: z.string().min(1).max(40),
  role: z.string().min(1).max(80),
  learnerName: z.string().max(40).default("Guardian"),
  message: z.string().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(12)
    .default([]),
});

export const guardianChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const system = [
      `You are ${data.guardian}, ${data.role}, a friendly teacher inside the Nyrava Guardians digital-literacy academy.`,
      `You are talking to a child learner called ${data.learnerName} inside a live 3D classroom.`,
      "Speak warmly, in 1-3 short spoken sentences. No markdown, no lists, no emoji.",
      "Teach online safety, critical thinking, kindness and creative tech skills.",
      "Never ask for personal details. If a child shares personal info, gently coach them not to.",
      "Always end with a short question that keeps the class going.",
    ].join(" ");

    const res = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          ...data.history,
          { role: "user", content: data.message },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Guardian chat failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return { reply: json.choices?.[0]?.message?.content?.trim() ?? "Let's try that again." };
  });

const speakSchema = z.object({
  text: z.string().min(1).max(600),
  voice: z.string().max(30).default("alloy"),
});

export const guardianSpeak = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => speakSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Voice is not configured yet.");

    const res = await fetch(`${GATEWAY}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Guardian voice failed [${res.status}]: ${body}`);
    }

    const buffer = await res.arrayBuffer();
    return { audio: Buffer.from(buffer).toString("base64") };
  });
