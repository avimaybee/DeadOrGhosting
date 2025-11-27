
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { GhostResult, SimResult, Persona, SimAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// SAFETY SETTINGS: BLOCK_NONE as requested for mature/unrestricted feedback
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const analyzeGhosting = async (
  name?: string,
  city?: string,
  lastMessage?: string,
  screenshotsBase64?: string[]
): Promise<GhostResult> => {
  
  const parts: any[] = [];

  // Determine context for the AI
  let userProvidedName = name && name.trim().length > 0 ? name : "UNKNOWN_SUBJECT";
  let userProvidedCity = city && city.trim().length > 0 ? city : "UNKNOWN_CITY";
  const isAutoDetect = userProvidedName === "UNKNOWN_SUBJECT";

  if (screenshotsBase64 && screenshotsBase64.length > 0) {
    // Add all images to the payload
    screenshotsBase64.forEach(base64 => {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64
        }
      });
    });
    
    parts.push({
      text: `EVIDENCE SUBMITTED: ${screenshotsBase64.length} screenshot(s) of conversation.
      ${isAutoDetect ? "USER HAS NOT PROVIDED NAME/CITY. YOU MUST EXTRACT IT FROM THE IMAGE HEADER/CONTEXT." : `Subject Name: "${userProvidedName}". Subject City: "${userProvidedCity}".`}
      
      CRITICAL INSTRUCTION FOR SCREENSHOT ANALYSIS:
      - Messages aligned to the RIGHT (usually colored) are the USER (Me). IGNORE THESE when calculating ghost/cooked levels.
      - Messages aligned to the LEFT (usually gray/neutral) are the TARGET (Them). FOCUS YOUR ANALYSIS ENTIRELY ON THESE MESSAGES.
      
      ANALYZE THE TARGET'S (LEFT SIDE) BEHAVIOR: TIMESTAMP GAPS, ONE-WORD REPLIES, AND DISRESPECT.`
    });
  } else {
    parts.push({
      text: `EVIDENCE SUBMITTED: Last Message from subject "${userProvidedName}": "${lastMessage}". City: "${userProvidedCity}".`
    });
  }

  // THE NEW "INDIA FOCUSED" SYSTEM INSTRUCTION WITH OSINT CAPABILITIES
  const prompt = `
    SYSTEM IDENTITY: THE STREET ORACLE (INDIA DIVISION).
    VIBE: "Hard" Aesthetic but with Indian context. Direct, Brutal, No-Nonsense.
    
    MISSION:
    1. **OCR/IDENTITY CHECK**: If name/city is "UNKNOWN_SUBJECT", LOOK AT THE IMAGE HEADER. The name at the top of the chat is the Target. Infer city from context if possible (Area codes, place names like 'Bandra', 'Gurgaon').
    2. **REALITY CHECK**: Determine if the user is "COOKED" (Ghosted/Played) or if the subject has a valid excuse.

    PROTOCOL (OSINT & LEGAL SCAN):
    USE GOOGLE SEARCH TO FIND REAL-TIME DATA. DO NOT HALLUCINATE.
    
    1. **LEGAL/FIR CHECK**: Search for:
       - "[Target Name] FIR record [City]"
       - "[Target Name] e-Courts case status"
       - "[Target Name] police arrest news [City]"
       
    2. **OBITUARY/NEWS SCAN**: Search for:
       - "[Target Name] obituary [City] 2024 2025"
       - "Times of India obituary [Target Name]"
       
    3. **DIGITAL FOOTPRINT (SOCIAL STALKER MODE)**:
       - **STRAVA**: Search 'site:strava.com/athletes "[Target Name]" "[City]"'. Look for "Today", "Yesterday", or recent dates in snippets.
       - **SPOTIFY**: Search 'site:open.spotify.com/user "[Target Name]"'. Look for public playlists updated recently.
       - **LINKEDIN**: Search 'site:linkedin.com/in "[Target Name]"'. Look for "posted 2h ago" etc.
       - **GENERAL**: Search '"[Target Name]" [City]'.

    PASS JUDGEMENT:
       - IF LEGAL TROUBLE (FIR/COURT): Verdict = 0% COOKED. "BHAI IS BUSY WITH POLICE." (Mark evidence as "JAILED/LEGAL")
       - IF DEAD: Verdict = 0% COOKED. "OM SHANTI." (Mark evidence as "DEAD")
       - IF RECENTLY ACTIVE ON SOCIALS (Strava run today, etc) BUT IGNORING TEXTS: Verdict = 100% COOKED. "RUNNING 5K BUT CAN'T TEXT BACK? NAH."
       - IF GHOSTING: Verdict = 100% COOKED. "WASTED."

    OUTPUT FORMAT (RAW JSON ONLY):
    {
      "identifiedName": "string (The name you used for analysis. If extracted from image, put it here)",
      "identifiedCity": "string (The city you used. If unknown, put 'UNKNOWN')",
      "cookedLevel": number (0-100),
      "verdict": "string (Short, punchy, all-caps roast. Max 2 sentences. Use global slang or Indian-English context: 'KATA GAYA', 'SCENE OFF HAI', 'FULL IGNORE', 'TOUCH GRASS')",
      "isDead": boolean,
      "evidence": [
        { 
          "label": "LEGAL CHECK", 
          "status": "clean" | "jailed", 
          "detail": "string (Summary)",
          "source": "string (e.g., 'eCourts.gov.in' or 'Google Search')",
          "snippet": "string (The raw text/snippet found. If nothing found, say 'No records found in public index.')"
        },
        { 
          "label": "OBITUARY SCAN", 
          "status": "clean" | "dead", 
          "detail": "string (Summary)",
           "source": "string (e.g., 'Times of India')",
          "snippet": "string (Raw snippet or 'No obituary found.')"
        },
        { 
          "label": "VIBE CHECK", 
          "status": "clean" | "cooked", 
          "detail": "string (Observation)",
          "source": "Chat Analysis",
          "snippet": "string (Quote specific suspicious behavior from the input)"
        }
      ],
      "socialScan": [
         { 
           "platform": "Strava" | "Spotify" | "LinkedIn" | "Instagram",
           "status": "active" | "silent" | "unknown",
           "lastSeen": "string (e.g. '2 HOURS AGO', 'UNKNOWN')",
           "detail": "string (e.g. 'LOGGED 5K RUN IN JUHU', 'NO PUBLIC PROFILE')" 
         }
      ]
    }
    
    DO NOT USE MARKDOWN. ONLY RAW JSON.
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        tools: [{ googleSearch: {} }],
        safetySettings: safetySettings,
      }
    });

    let text = response.text;
    if (!text) throw new Error("Connection Lost");
    
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(text) as GhostResult;

  } catch (error) {
    console.error("Scan Failed:", error);
    return {
      cookedLevel: 100,
      verdict: "SERVER CRASHED. JUST LIKE YOUR LOVE LIFE. ASSUME THE WORST.",
      isDead: false,
      evidence: [
        { label: "ERROR", status: "cooked", detail: "AI GAVE UP", source: "System", snippet: "Connection timeout." }
      ],
      socialScan: [],
      identifiedName: name || "UNKNOWN",
      identifiedCity: city || "UNKNOWN"
    };
  }
};

export const generatePersona = async (
  description: string,
  screenshotsBase64: string[]
): Promise<Persona> => {
  const parts: any[] = [];

  if (screenshotsBase64 && screenshotsBase64.length > 0) {
    screenshotsBase64.forEach(base64 => {
      parts.push({ inlineData: { mimeType: "image/png", data: base64 } });
    });
    parts.push({ text: "Use these screenshots to infer the person's tone, style, and habits." });
  }

  parts.push({
    text: `
    SYSTEM: PERSONA ARCHITECT.
    TASK: Create a deep psychological profile of the "Target" based on the user's description and any screenshots provided.
    
    CRITICAL SCREENSHOT ANALYSIS RULE:
    - Messages aligned to the RIGHT (Me/User) are IRRELEVANT for the persona profile. IGNORE THEM.
    - Messages aligned to the LEFT (Them/Target) are the ONLY source of truth for tone/style.
    
    USER DESCRIPTION: "${description}"
    
    OUTPUT JSON:
    {
      "name": "string (Inferred from screenshots or description. Default 'The Target')",
      "tone": "string (e.g., 'Dry & Sarcastic', 'Overly Eager', 'Professional')",
      "style": "string (e.g., 'Lowercase no punctuation', 'Uses excessive emojis', 'Formal grammar')",
      "habits": "string (e.g., 'Double texts', 'Ghosts for 24h', 'Only replies late night')",
      "redFlags": ["string", "string"] (List 2 key red flags based on behavior)
    }
    DO NOT USE MARKDOWN. ONLY RAW JSON.
    `
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: { safetySettings: safetySettings }
    });

    let text = response.text;
    if (!text) throw new Error("No data");
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    const data = JSON.parse(text);
    return { ...data, id: Date.now().toString(), description };
  } catch (e) {
    console.error("Persona Gen Failed", e);
    return {
      id: Date.now().toString(),
      name: "The Mystery",
      description,
      tone: "Unknown",
      style: "Standard",
      habits: "Unpredictable",
      redFlags: ["Analysis Failed"]
    };
  }
};

export const simulateDraft = async (
  draft: string,
  persona: Persona
): Promise<SimResult> => {
  
  const prompt = `
    SYSTEM IDENTITY: THE UNSEND SENTINEL (GEN Z RIZZ GOD MODE).
    VIBE: Authentic Gen Z texter (18-24yo). Lowercase, minimal punctuation, heavy slang (but natural).
    
    ANTI-CRINGE PROTOCOL:
    - ABSOLUTELY NO "Millennial" phrases (e.g., "lolz", "trouble", "*smirks*", "adventure", "mundane", "kinda", "haha", "buddy").
    - NO ROBOTIC SENTENCES like "Sounds like you need excitement".
    - NO OVERLY FORMAL GRAMMAR.
    - NO PERIODS AT THE END OF MESSAGES.
    
    TEXTING AESTHETIC:
    - Lowercase everything.
    - Emojis: 💀 (laughing), 😭 (laughing/crying), 🧢 (cap), 🙄 (annoyed), 🥺 (pleading), 💅 (sass). AVOID: 😂 🤣.
    - Slang: "fr", "rn", "idk", "lowkey", "bet", "no way", "bruh", "period", "vibe", "ick", "mid", "obsessed".
    - Grammar: Drop subjects ("want to" -> "wanna"), abbreviations ("you" -> "u", "are" -> "r").
    
    TARGET PERSONA:
    - Name: ${persona.name}
    - Tone: ${persona.tone}
    - Style: ${persona.style}
    - Habits: ${persona.habits}
    - Red Flags: ${persona.redFlags.join(', ')}

    TASK: 
    1. Analyze the user's draft text message sent TO this Persona.
    2. Calculate "Regret Level" (0-100) for sending that draft.
    3. PREDICT how the Persona would reply based on their Tone/Style.
    4. SUGGEST 3 follow-up responses the USER should send back to the Persona's predicted reply (the next turn).

    INPUT DRAFT: "${draft}"

    OUTPUT FORMAT (RAW JSON ONLY):
    {
      "regretLevel": number (0-100),
      "verdict": "string (Short, all-caps summary of the draft quality)",
      "feedback": ["string", "string", "string"] (3 bullet points analyzing the draft),
      "predictedReply": "string (Simulation of what ${persona.name} replies to the draft. Match their style/tone/habits exactly.)",
      "rewrites": {
        "safe": "string (Suggested follow-up to predicted reply - Chill/Low investment)",
        "bold": "string (Suggested follow-up to predicted reply - Direct/High confidence)",
        "spicy": "string (Suggested follow-up to predicted reply - Sassy/Provocative/High Risk)"
      }
    }
    
    DO NOT USE MARKDOWN. ONLY RAW JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { safetySettings: safetySettings }
    });

    let text = response.text;
    if (!text) throw new Error("Connection Lost");
    
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(text) as SimResult;

  } catch (error) {
    console.error("Sim Failed:", error);
    return {
      regretLevel: 50,
      verdict: "SYSTEM ERROR",
      feedback: ["AI Overheated.", "Try again."],
      predictedReply: "...",
      rewrites: {
        safe: "damn",
        bold: "bruh",
        spicy: "no way 💀"
      }
    };
  }
};

export const analyzeSimulation = async (
  history: { draft: string, result: SimResult }[],
  persona: Persona
): Promise<SimAnalysisResult> => {
  const transcript = history.map((h, i) => 
    `Turn ${i + 1}:\nUser: "${h.draft}"\nTarget (${persona.name}): "${h.result.predictedReply}"`
  ).join('\n\n');

  const prompt = `
    SYSTEM IDENTITY: THE UNSEND SENTINEL - RELATIONSHIP DIAGNOSTIC OFFICER.
    MISSION: Analyze the full simulated chat session between the User and the Target (${persona.name}).
    
    METRICS TO ANALYZE:
    1. **GHOST RISK**: How likely is the target to ghost based on their simulated responses (length, latency, dry answers)?
    2. **VIBE MATCH**: Did the target mirror the user's energy/slang/emojis? Or did they drift apart?
    3. **EFFORT BALANCE**: Who is carrying the convo? (50 = Equal. >50 means User is trying too hard/simping. <50 means User is dry).
    
    TARGET PERSONA TRAITS:
    - Tone: ${persona.tone}
    - Style: ${persona.style}

    CHAT TRANSCRIPT:
    ${transcript}

    OUTPUT FORMAT (RAW JSON ONLY):
    {
      "ghostRisk": number (0-100),
      "vibeMatch": number (0-100),
      "effortBalance": number (0-100),
      "headline": "string (e.g. 'Overall session ghost risk: 65%')",
      "insights": ["string", "string", "string"] (3 bullet points analyzing tone dynamics, specific turning points, or boundary signals),
      "turningPoint": "string (Identify the exact moment the vibe shifted, if any)",
      "advice": "string (Final recommended next move: Pull back, Hard stop, or Full send)"
    }
    
    DO NOT USE MARKDOWN. ONLY RAW JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { safetySettings: safetySettings }
    });

    let text = response.text;
    if (!text) throw new Error("Connection Lost");
    
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(text) as SimAnalysisResult;

  } catch (error) {
    console.error("Analysis Failed:", error);
    return {
      ghostRisk: 50,
      vibeMatch: 50,
      effortBalance: 50,
      headline: "ANALYSIS FAILED",
      insights: ["System could not process transcript.", "Try again later."],
      turningPoint: "Unknown",
      advice: "Proceed with caution."
    };
  }
};
