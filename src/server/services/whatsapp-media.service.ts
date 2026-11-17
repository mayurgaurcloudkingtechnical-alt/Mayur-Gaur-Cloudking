import fs from "fs/promises";
import path from "path";
import { WhatsAppBusinessConfigService } from "./whatsapp-business-config.service";

const MEDIA_ROOT = path.join(process.cwd(), "storage", "whatsapp-media");

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

export interface StoredWhatsAppMedia {
  mediaId: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  secureUrl: string;
}

export class WhatsAppMediaService {
  static async downloadAndStoreMedia(
    mediaId: string,
    fallbackMime?: string,
    originalFilename?: string
  ): Promise<StoredWhatsAppMedia | null> {
    if (!mediaId) return null;
    try {
      const cfg = await WhatsAppBusinessConfigService.getConfig();
      const token = cfg.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
      if (!token) return null;

      // 1. Resolve temporary download URL from Meta Graph API v21.0
      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(mediaId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!metaRes.ok) return null;
      const metaJson = (await metaRes.json()) as { url?: string; mime_type?: string; file_size?: number };
      if (!metaJson.url) return null;

      // 2. Download binary with Bearer token
      const binRes = await fetch(metaJson.url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!binRes.ok) return null;
      const arrayBuf = await binRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      const mimeType = metaJson.mime_type || fallbackMime || "application/octet-stream";
      const ext = MIME_EXT[mimeType.split(";")[0].trim()] || "bin";
      const safeBase = (originalFilename || mediaId).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
      const storedName = safeBase.includes(".") ? `${mediaId}_${safeBase}` : `${mediaId}_${safeBase}.${ext}`;

      await fs.mkdir(MEDIA_ROOT, { recursive: true });
      await fs.writeFile(path.join(MEDIA_ROOT, storedName), buffer);

      return {
        mediaId,
        mimeType,
        fileName: storedName,
        sizeBytes: buffer.length,
        secureUrl: `/api/whatsapp/media/${encodeURIComponent(storedName)}`,
      };
    } catch (err) {
      console.error("[WhatsAppMediaService] download error:", err);
      return null;
    }
  }
}
