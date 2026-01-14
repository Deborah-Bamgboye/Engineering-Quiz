
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export const generateQuizQuestions = async (): Promise<Question[]> => {
  const apiKey = process.env.API_KEY;

  // Debugging helper for the user
  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    console.error("DEBUG: process.env.API_KEY is currently:", apiKey);
    throw new Error(
      "API Key missing or invalid. \n\n" +
      "To fix this:\n" +
      "1. Go to aistudio.google.com\n" +
      "2. Click 'Get API key'\n" +
      "3. Click 'Create API key in new project'\n" +
      "4. Add this key to your Vercel/Environment variables as 'API_KEY'."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Generate exactly 50 university-level engineering quiz questions for 1st-3rd year students.
  
  Distribution:
  1. Engineering Mathematics (15 questions)
  2. Physics (10 questions)
  3. Chemistry (5 questions)
  4. Mathematical Logic & Reasoning (10 questions)
  5. General Engineering Knowledge (10 questions)

  Return exactly 50 items. Ensure explanations are detailed.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["id", "category", "question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text.trim());
  } catch (e: any) {
    if (e.message?.includes("API_KEY_INVALID")) {
      throw new Error("The API key provided is invalid. Please double-check it in AI Studio.");
    }
    throw e;
  }
};
