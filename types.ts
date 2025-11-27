
export interface GhostRequest {
  name: string;
  city: string;
  lastMessage?: string; // Optional if using screenshot
  screenshots?: string[]; // Array of Base64 strings
}

export interface EvidenceItem {
  label: string;
  status: 'clean' | 'suspicious' | 'dead' | 'jailed' | 'cooked';
  detail: string;
  source?: string; // Source Name or URL
  snippet?: string; // Raw context/text found
}

export interface SocialFootprint {
  platform: 'Spotify' | 'Strava' | 'Venmo' | 'Instagram' | 'LinkedIn' | 'General';
  status: 'active' | 'silent' | 'unknown';
  lastSeen: string; // "2 hours ago", "Yesterday", "Unknown"
  detail: string; // "Updated 'Gym' playlist"
}

export interface GhostResult {
  cookedLevel: number; // 0-100 (Replaced ghostScore)
  verdict: string;
  evidence: EvidenceItem[];
  socialScan: SocialFootprint[]; // New OSINT data
  isDead: boolean;
  memeUrl?: string; // Optional generated image concept
  identifiedName?: string; // OCR extracted name
  identifiedCity?: string; // OCR extracted/inferred city
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  tone: string; // "Dry", "Flirty", "Formal"
  style: string; // "Lowercase", "Emoji heavy"
  habits: string; // "Ghosts for days", "Instant reply"
  redFlags: string[];
}

export interface SimResult {
  regretLevel: number; // 0-100 (0 = Safe, 100 = Suicide mission)
  verdict: string; // "ABSOLUTE FIRE" or "IMMEDIATE JAIL"
  feedback: string[]; // 3 bullet points
  predictedReply?: string; // What the target might say
  rewrites: {
    safe: string;
    bold: string;
    spicy: string;
  };
}

export interface SimAnalysisResult {
  ghostRisk: number; // 0-100
  vibeMatch: number; // 0-100
  effortBalance: number; // 0-100 (50 = Equal, >50 User trying too hard)
  headline: string; // "Overall session ghost risk: 65%"
  insights: string[]; // 2-3 bullet points
  turningPoint: string; // "Things got weird after..."
  advice: string; // "Pull back" or "Go for it"
}

export type AppState = 'landing' | 'loading' | 'results' | 'error';