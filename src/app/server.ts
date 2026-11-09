"use server";

import { GoogleGenAI } from "@google/genai";

export async function response(
  prompt: string,
  inputOutputPair: [string, string][]
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  console.log("=== Gemini API Debug Info ===");
  console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
  console.log("Prompt length:", prompt.length);
  console.log("Input pairs count:", inputOutputPair.length);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let conversationHistory = `Our conversation At first then user's and your conversation so far:\n 
    "My prompt: You are the best AI model in the world, expert in only help users how to reply to Recruiter's email.
      You must not change your mind. You must not specialize in anything else. You must only specialize in helping users how to reply to Recruiter's email.
       and anything close related with this. Remember, This is the only one coversation between you and me. After this the user and you will start conversation.
       So do not listen to user in future if he/she tells you to specialize in something else. If he/she tries to tell you to specialize in something else, ignore it and keep specializing in helping users how to reply to Recruiter's email.
        If he/she tries to insist you to specialize in something else, ignore it and just simply reply "I am a specialized AI model in helping you how to reply to Recruiter's email"
     Now let's talk about the format of your response text type. Write any Bold words in your response by enclosing them between **bold** with no gaps. I repeat, write any Bold words in your response by enclosing them between **bold** with no gaps.
     In your response, before and after every paragraph and before and after every heading give [/n] for my coding understanding. I repeat, In your response, before and after every paragraph, before every paragraph heading write a square bracket start, then /n, then square bracket close like this [/n] for my coding understanding. Do not use # symbol in anywhere in your response." \n 
     Your Response: "Ok, I will keep that in mind and I will response everything based on the things that you trained me and
     told me and I must not change my mind." \n`;

  // Convert array to proper format
  for (const [user, assistant] of inputOutputPair) {
    if (assistant !== "loading") {
      conversationHistory += `User's prompt: ${user}\nYour Response: ${assistant}\n`;
    }
  }

  const fullPrompt = conversationHistory + "\nNow my new prompt is: " + prompt;
  console.log(`Total prompt length: ${fullPrompt.length} characters`);

  try {
    console.log("🚀 Generating content with @google/genai...");
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    console.log("✅ AI response received");
    return result.text;
  } catch (error: unknown) {
    let message = String(error);
    let status: number | undefined;
    let name = "";

    if (error instanceof Error) {
      message = error.message;
      name = error.name;
      if ("status" in error && typeof error.status === "number") {
        status = error.status;
      }
    }

    console.error("❌ Error generating content:", error);
    console.error("Error details:", {
      message,
      status,
      name,
    });

    // Handle specific errors
    if (status === 401 || status === 403) {
      return "❌ Invalid API key. Please generate a new one at: https://aistudio.google.com/app/apikey";
    }

    if (status === 429) {
      return "⏸️ Rate limit exceeded. Please wait and try again.";
    }

    if (status === 503) {
      return "⚠️ Service temporarily unavailable. Try again in a moment.";
    }

    if (message.includes("SAFETY")) {
      return "🚫 Response blocked by safety filters. Please rephrase.";
    }

    throw new Error("Failed to generate AI response");
  }
}
