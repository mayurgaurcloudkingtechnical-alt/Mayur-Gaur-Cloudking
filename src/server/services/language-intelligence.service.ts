export type SupportedLanguage = "ENGLISH" | "HINDI" | "HINGLISH";

export class LanguageIntelligenceService {
  private static HINGLISH_KEYWORDS = [
    "bhaiya", "bhai", "sir ji", "namaste", "pranam", "kya", "hai", "hain", "kitne", "kitna",
    "kitni", "ka", "ki", "ke", "ko", "karna", "karni", "karne", "chahiye", "mujhe", "mera",
    "meri", "mere", "aap", "aapka", "kaha", "kahan", "kab", "kaisa", "kaisi", "kaise",
    "fees kitni", "kitna lagega", "placement milegi", "job milegi", "online hoga", "offline hoga",
    "batch kab shuru", "prayagraj me", "padhna hai", "admission lena hai", "batao", "bataiye",
    "samajh", "nahi", "nhi", "thik", "theek", "accha", "achha", "sahi", "lekin", "magar"
  ];

  /**
   * Detects customer communication language from message content and existing context
   */
  public static detectLanguage(
    messageText: string,
    existingContextLanguage?: SupportedLanguage
  ): SupportedLanguage {
    const text = messageText.trim();
    const lower = text.toLowerCase();

    // 1. Explicit user override requests
    if (
      lower.includes("english please") ||
      lower.includes("speak in english") ||
      lower.includes("talk in english") ||
      lower.includes("in english") ||
      lower === "english"
    ) {
      return "ENGLISH";
    }

    if (
      lower.includes("hindi please") ||
      lower.includes("hindi me") ||
      lower.includes("hindi mein") ||
      lower.includes("speak in hindi") ||
      lower === "hindi"
    ) {
      return "HINGLISH";
    }

    // 2. Check for Devanagari script (Pure Hindi)
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    if (hasDevanagari) {
      return "HINDI";
    }

    // 3. Check for Hinglish phonetics and vocabulary
    const words = lower.split(/\s+/).map((w) => w.replace(/[^\w]/g, ""));
    const hinglishMatchCount = words.filter((w) => this.HINGLISH_KEYWORDS.includes(w)).length;

    if (hinglishMatchCount >= 1 || lower.includes("kitne ka") || lower.includes("kya hai") || lower.includes("admission lena")) {
      return "HINGLISH";
    }

    // 4. If ongoing conversation has a language established and current message is ambiguous (e.g. "ok", "yes", "fees?")
    if (existingContextLanguage && words.length <= 3) {
      return existingContextLanguage;
    }

    // 5. Default to English
    return "ENGLISH";
  }

  /**
   * Generates localized greeting and tone instructions for the AI Counselor
   */
  public static getToneInstruction(language: SupportedLanguage): string {
    switch (language) {
      case "HINDI":
        return `Respond strictly in polite, professional Hindi (Devanagari script). Be warm, respectful, and guide the student about SoftLab Global's Prayagraj campus and practical training.`;
      case "HINGLISH":
        return `Respond naturally in polite, conversational Indian Hinglish (Roman script, e.g. "Namaste! SoftLab Global mein aapka swagat hai..."). Speak like an empathetic admissions counselor at the Civil Lines, Prayagraj campus. Be direct, clear, and reassuring.`;
      case "ENGLISH":
      default:
        return `Respond in crisp, professional, and friendly Indian English. Highlight SoftLab Global's industry curriculum, Prayagraj offline/online labs, and 100% placement support.`;
    }
  }
}
