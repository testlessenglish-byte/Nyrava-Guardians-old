import { createServerFn } from "@tanstack/react-start";

export const getAIConfigurationStatus = createServerFn({ method: "GET" }).handler(async () => ({
  geminiConfigured: Boolean(process.env["GEMINI_API_KEY"]),
  provider: "Gemini",
  chatModel: "Gemini 2.5 Flash",
  voiceModel: "Gemini 2.5 Flash TTS",
}));
