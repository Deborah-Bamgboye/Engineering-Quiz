
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateQuizQuestions = async (): Promise<Question[]> => {
  const prompt = `Generate exactly 50 university-level engineering quiz questions for 1st-3rd year students.
  
  Distribution:
  1. Engineering Mathematics (15 questions): Focus on Calculus (PDEs, Higher order differentials, ODEs), Linear Algebra, and Complex Numbers.
  2. Physics (10 questions): Thermodynamics, Electromagnetism, and Mechanics.
  3. Chemistry (5 questions): Physical chemistry, materials science for engineers.
  4. Mathematical Logic & Reasoning (10 questions): Pattern recognition, syllogisms, and logical flow.
  5. General Engineering Knowledge & Random (10 questions): History of engineering, ethics, or emerging tech (SpaceX, AI, Sustainability).

  Difficulty: Sophisticated but accessible to a motivated 1st year student. 
  Ensure each question is unique and technical.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
            correctAnswer: { type: Type.INTEGER, description: "Index (0-3) of the correct option" },
            explanation: { type: Type.STRING }
          },
          required: ["id", "category", "question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  try {
    const questions = JSON.parse(response.text);
    return questions;
  } catch (e) {
    console.error("Failed to parse quiz questions", e);
    throw new Error("Could not generate quiz questions. Please try again.");
  }
};
