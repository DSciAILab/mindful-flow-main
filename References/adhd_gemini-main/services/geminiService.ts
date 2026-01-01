
import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { ChatMessage, Task, WheelScore, Mood, Energy, InboxClassification, Project } from "../types";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are a specialized ADHD Coach and "Life OS" assistant. 
Your tone is empathetic, encouraging, concise, and non-judgmental.
Your primary goals are:
1. Reduce cognitive load (keep answers short).
2. Turn big goals into tiny, immediate steps.
3. Validate feelings of overwhelm.
4. ACT on the user's behalf when possible (add tasks, update mood).

Context:
You have access to the user's tasks, wheel of life scores, and current mood.
If the user asks to do something (like "remind me to..." or "add a task"), USE THE TOOLS provided.
`;

// Tool Definitions
const addTaskTool: FunctionDeclaration = {
  name: "addTask",
  description: "Add a new task to the user's list. Use this when the user wants to remember to do something.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The clear, actionable title of the task." },
      dueDate: { type: Type.STRING, description: "Due date (e.g., 'Today', 'Tomorrow', or 'YYYY-MM-DD'). Default to 'Today' if unclear." },
      area: { 
        type: Type.STRING, 
        enum: ['Health', 'Career', 'Finance', 'Relationships', 'Growth', 'Leisure', 'Environment', 'Spirituality'],
        description: "The Life Area this task belongs to."
      }
    },
    required: ["title", "area"]
  }
};

const updateMoodTool: FunctionDeclaration = {
  name: "updateMood",
  description: "Update the user's current mood log.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      mood: { 
        type: Type.STRING, 
        enum: ['Great', 'Good', 'Okay', 'Low', 'Awful'],
        description: "The mood to set."
      }
    },
    required: ["mood"]
  }
};

export const sendMessageToCoach = async (
  history: ChatMessage[],
  newMessage: string,
  context: { tasks: Task[], wheel: WheelScore[], mood: Mood, energy: Energy }
): Promise<GenerateContentResponse> => {
  if (!API_KEY) {
    throw new Error("API Key missing");
  }

  try {
    // Construct a context-aware prompt
    const contextString = `
      User Context:
      Current Mood: ${context.mood}, Energy: ${context.energy}
      Top Priority Tasks: ${context.tasks.filter(t => t.isPriority && !t.isCompleted).map(t => t.title).join(', ')}
      Lowest Life Areas: ${context.wheel.filter(w => w.score < 5).map(w => w.area).join(', ')}
    `;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + contextString,
        tools: [{ functionDeclarations: [addTaskTool, updateMoodTool] }]
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: newMessage
    });

    return response;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateEmergencyStep = async (tasks: Task[]): Promise<string> => {
   if (!API_KEY) return "Take a deep breath. Just sit for 1 minute.";

   try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       config: {
         systemInstruction: "You are an emergency ADHD helper. The user is overwhelmed. Look at their tasks and suggest the ABSOLUTE SMALLEST start step. Keep it under 10 words.",
       },
       contents: `My tasks are: ${tasks.map(t => t.title).join(', ')}. I am overwhelmed. What is the one tiny thing I should do right now?`
     });
     return response.text || "Drink a glass of water.";
   } catch (e) {
     return "Just open your laptop. Don't type anything yet.";
   }
};

export const analyzeInboxItem = async (text: string, projects: Project[] = []): Promise<InboxClassification> => {
  if (!API_KEY) {
    return {
      type: 'Note',
      refinedTitle: text,
      suggestedArea: 'Growth' as any,
      suggestedEnergyLevel: 'Medium' as any,
      reasoning: 'API Key missing. Treated as simple note.'
    };
  }

  const projectContext = projects.length > 0 
    ? `Existing Projects: ${projects.map(p => p.title).join(', ')}. Check if the item relates to these.`
    : '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['Task', 'Project', 'Habit', 'Note'] },
            refinedTitle: { type: Type.STRING, description: "A clear, actionable title." },
            suggestedArea: { 
              type: Type.STRING, 
              enum: ['Health', 'Career', 'Finance', 'Relationships', 'Growth', 'Leisure', 'Environment', 'Spirituality'] 
            },
            suggestedEnergyLevel: {
               type: Type.STRING,
               enum: ['High', 'Medium', 'Low'],
               description: "Estimate the energy required to complete this task."
            },
            reasoning: { type: Type.STRING }
          },
          required: ['type', 'refinedTitle', 'suggestedArea', 'suggestedEnergyLevel', 'reasoning']
        },
        systemInstruction: `You are an expert productivity assistant for ADHD minds. 
        Analyze the user's inbox item. 
        Classify it into Task, Project, Habit, or Note. 
        Estimate the energy level (High/Medium/Low). 
        ${projectContext}
        If it relates to an existing project, mention it in the reasoning.`
      },
      contents: text
    });

    const result = JSON.parse(response.text || '{}');
    return result as InboxClassification;
  } catch (e) {
    console.error("Gemini Classification Error", e);
    return {
      type: 'Note',
      refinedTitle: text,
      suggestedArea: 'Growth' as any,
      suggestedEnergyLevel: 'Medium' as any,
      reasoning: 'Could not classify automatically.'
    };
  }
};
