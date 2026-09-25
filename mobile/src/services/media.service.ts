import { learningService } from '../api/learning';
import { LessonContentDetails, LessonResourceDownloadResponse } from '../types/learning';

export type VideoSourceType = 'DIRECT_URL' | 'BUNNY_STREAM' | 'EXTERNAL_URL' | 'NONE';

export interface VideoPlaybackDescriptor {
  canPlayNatively: boolean;
  sourceType: VideoSourceType;
  streamUrl: string | null;
  bunnyVideoId: string | null;
  requiresSigningBackend: boolean;
  statusMessage: string;
}

export interface WatermarkData {
  text: string;
  studentEmail: string;
  timestamp: string;
}

export class MediaService {
  /**
   * Resolves the video playback descriptor based on lesson content details.
   * Ensures secure handling without exposing secrets or fabricating unverified URLs.
   */
  static resolveVideoPlayback(content: LessonContentDetails | null): VideoPlaybackDescriptor {
    if (!content) {
      return {
        canPlayNatively: false,
        sourceType: 'NONE',
        streamUrl: null,
        bunnyVideoId: null,
        requiresSigningBackend: false,
        statusMessage: 'No media content attached to this lesson.',
      };
    }

    // Direct video stream URL (e.g. MP4 or HLS m3u8)
    if (content.videoUrl && content.videoUrl.trim().length > 0) {
      const url = content.videoUrl.trim();
      const isHttps = url.startsWith('https://');
      return {
        canPlayNatively: isHttps,
        sourceType: 'DIRECT_URL',
        streamUrl: url,
        bunnyVideoId: null,
        requiresSigningBackend: !isHttps,
        statusMessage: isHttps
          ? 'Secure stream ready for playback.'
          : 'Insecure (non-HTTPS) media URL blocked by security policy.',
      };
    }

    // Bunny Stream video ID
    if (content.bunnyVideoId && content.bunnyVideoId.trim().length > 0) {
      const bunnyId = content.bunnyVideoId.trim();
      // The backend currently uses public web iframe embed.
      // Native mobile HLS stream playback requires server-side token signing (SHA256 signature).
      return {
        canPlayNatively: false,
        sourceType: 'BUNNY_STREAM',
        streamUrl: null,
        bunnyVideoId: bunnyId,
        requiresSigningBackend: true,
        statusMessage:
          'Bunny Stream video detected. Native playback requires backend token-signing service (Step 5B).',
      };
    }

    // External link
    if (content.externalUrl && content.externalUrl.trim().length > 0) {
      return {
        canPlayNatively: false,
        sourceType: 'EXTERNAL_URL',
        streamUrl: content.externalUrl.trim(),
        bunnyVideoId: null,
        requiresSigningBackend: false,
        statusMessage: 'External video link available.',
      };
    }

    return {
      canPlayNatively: false,
      sourceType: 'NONE',
      streamUrl: null,
      bunnyVideoId: null,
      requiresSigningBackend: false,
      statusMessage: 'No video stream configured for this lesson.',
    };
  }

  /**
   * Generates dynamic student watermark data for video player overlay.
   * Prevents screen recording misuse and asserts session authenticity.
   */
  static generateWatermark(studentEmail?: string, studentId?: string): WatermarkData {
    const email = studentEmail || 'student@softlab.global';
    const id = studentId ? ` • ID: ${studentId}` : '';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timestamp = `${dateStr} ${timeStr}`;

    return {
      text: `${email}${id} • ${timestamp}`,
      studentEmail: email,
      timestamp,
    };
  }

  /**
   * Requests a short-lived (5-minute) AWS presigned download URL for lesson document / PDF.
   */
  static async requestDocumentDownload(
    enrollmentId: string,
    lessonId: string
  ): Promise<LessonResourceDownloadResponse> {
    try {
      return await learningService.getLessonResourceDownloadUrl(enrollmentId, lessonId);
    } catch (err: any) {
      return {
        available: false,
        message: err?.message || 'Failed to request resource download URL.',
      };
    }
  }

  /**
   * Humanizes file size bytes into KB/MB string.
   */
  static formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
