import * as crypto from "crypto";

export class VerificationSecurityService {
  private static getEncryptionKey(): Buffer {
    const rawSecret =
      process.env.VERIFICATION_ENCRYPTION_KEY ||
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "slg_default_master_verification_key_32_bytes_len";

    // Hash to exactly 32 bytes for AES-256
    return crypto.createHash("sha256").update(rawSecret).digest();
  }

  /**
   * Encrypts sensitive string using AES-256-GCM with unique 12-byte IV and auth tag.
   * Returns "iv:authTag:ciphertext" in hex encoding.
   */
  public static encrypt(plainText: string): string {
    if (!plainText) return "";
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts AES-256-GCM ciphertext. Returns original plaintext.
   */
  public static decrypt(cipherCompound: string): string {
    if (!cipherCompound || !cipherCompound.includes(":")) return "";
    try {
      const [ivHex, authTagHex, encryptedHex] = cipherCompound.split(":");
      if (!ivHex || !authTagHex || !encryptedHex) return "";

      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err) {
      console.error("Decryption failed for secure field:", err);
      return "[DECRYPTION_ERROR]";
    }
  }

  /**
   * Masks PAN: Displays first 5 characters and last 1 character, masking digits.
   * Example: "ABCDE1234F" -> "ABCDE****F"
   */
  public static maskPan(pan: string): string {
    if (!pan) return "";
    const cleaned = pan.trim().toUpperCase();
    if (cleaned.length !== 10) return "INVALID_PAN";
    return `${cleaned.slice(0, 5)}****${cleaned.slice(9)}`;
  }

  /**
   * Masks Aadhaar: Only displays the last 4 digits.
   * Example: "987654321098" -> "XXXX-XXXX-1098"
   */
  public static maskAadhaar(aadhaar: string): string {
    if (!aadhaar) return "";
    const cleaned = aadhaar.replace(/\D/g, "");
    if (cleaned.length !== 12) return "INVALID_AADHAAR";
    return `XXXX-XXXX-${cleaned.slice(8)}`;
  }

  /**
   * Masks Bank Account: Displays last 4 digits only.
   * Example: "123456789012" -> "••••••••9012"
   */
  public static maskBankAccount(accountNumber: string): string {
    if (!accountNumber) return "";
    const cleaned = accountNumber.replace(/\s+/g, "");
    if (cleaned.length < 4) return "••••";
    return `••••••••${cleaned.slice(-4)}`;
  }

  /**
   * Masks GSTIN: Shows State Code (first 2 digits) and last 3 characters.
   * Example: "09AFYFS5388G1ZX" -> "09**********1ZX"
   */
  public static maskGstin(gstin: string): string {
    if (!gstin) return "";
    const cleaned = gstin.trim().toUpperCase();
    if (cleaned.length !== 15) return "INVALID_GSTIN";
    return `${cleaned.slice(0, 2)}**********${cleaned.slice(12)}`;
  }

  /**
   * Deep sanitizes an object to ensure no raw PAN, Aadhaar, account numbers, or OTPs leak to logs.
   */
  public static sanitizeForAudit<T>(data: T): T {
    if (!data || typeof data !== "object") return data;

    const cloned = JSON.parse(JSON.stringify(data));

    const sensitiveKeyPatterns = [
      /pan/i,
      /aadhaar/i,
      /accountnumber/i,
      /account_no/i,
      /otp/i,
      /password/i,
      /secret/i,
      /token/i,
      /cvv/i,
    ];

    function sanitizeNode(obj: any) {
      if (!obj || typeof obj !== "object") return;

      for (const key of Object.keys(obj)) {
        const val = obj[key];
        const isSensitive = sensitiveKeyPatterns.some((pattern) => pattern.test(key));

        if (isSensitive && typeof val === "string") {
          if (/pan/i.test(key)) {
            obj[key] = VerificationSecurityService.maskPan(val);
          } else if (/aadhaar/i.test(key)) {
            obj[key] = VerificationSecurityService.maskAadhaar(val);
          } else if (/account/i.test(key)) {
            obj[key] = VerificationSecurityService.maskBankAccount(val);
          } else {
            obj[key] = "[REDACTED]";
          }
        } else if (typeof val === "object") {
          sanitizeNode(val);
        }
      }
    }

    sanitizeNode(cloned);
    return cloned;
  }
}
