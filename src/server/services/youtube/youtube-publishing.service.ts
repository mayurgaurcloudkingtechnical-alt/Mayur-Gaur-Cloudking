import { db } from "@/server/db/client";

export interface YouTubeOAuthConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  channelId?: string;
  channelTitle?: string;
  defaultPrivacy?: "PRIVATE" | "UNLISTED" | "PUBLIC";
  autoPublishEnabled?: boolean;
  allowedCourseIds?: string[];
}

export class YouTubePublishingService {
  /**
   * Retrieves active YouTube OAuth configuration from DB system settings or env
   */
  public static async getOAuthConfig(): Promise<YouTubeOAuthConfig> {
    let storedConfig: any = {};
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: "youtube_oauth_config" },
      });
      if (setting && typeof setting.value === "object") {
        storedConfig = setting.value;
      }
    } catch {}

    return {
      clientId: storedConfig.clientId || process.env.YOUTUBE_CLIENT_ID,
      clientSecret: storedConfig.clientSecret || process.env.YOUTUBE_CLIENT_SECRET,
      refreshToken: storedConfig.refreshToken || process.env.YOUTUBE_REFRESH_TOKEN,
      accessToken: storedConfig.accessToken,
      tokenExpiresAt: storedConfig.tokenExpiresAt,
      channelId: storedConfig.channelId || process.env.YOUTUBE_CHANNEL_ID,
      channelTitle: storedConfig.channelTitle || "SoftLab Global Official",
      defaultPrivacy: storedConfig.defaultPrivacy || "UNLISTED",
      autoPublishEnabled: storedConfig.autoPublishEnabled ?? false,
      allowedCourseIds: storedConfig.allowedCourseIds || [],
    };
  }

  /**
   * Generates standard professional title for lecture
   * Format: [Course Name] | [Module Name] — [Lecture Topic] | SoftLab Global
   */
  public static generateTitle(courseTitle: string, moduleTitle: string, topicTitle: string): string {
    const brand = " | SoftLab Global";
    const maxContentLength = 100 - brand.length; // 83 characters max for content
    const cleanCourse = courseTitle.trim();
    const cleanModule = moduleTitle ? ` | ${moduleTitle.trim()}` : "";
    const cleanTopic = topicTitle.trim();

    let content = `${cleanCourse}${cleanModule} — ${cleanTopic}`;
    if (content.length > maxContentLength) {
      content = `${content.slice(0, maxContentLength - 3)}...`;
    }
    return `${content}${brand}`;
  }

  /**
   * Generates comprehensive SEO and branding description
   */
  public static generateDescription(params: {
    courseTitle: string;
    moduleTitle: string;
    lectureTopic: string;
    trainerName: string;
    batchCode: string;
  }): string {
    return [
      `🎓 ${params.lectureTopic}`,
      `Course: ${params.courseTitle}`,
      params.moduleTitle ? `Module: ${params.moduleTitle}` : "",
      `Faculty: ${params.trainerName} | Batch: ${params.batchCode}`,
      ``,
      `=========================================`,
      `ABOUT SOFTLAB GLOBAL`,
      `SoftLab Global is an industry-leading software training institute & IT development center providing practical hands-on engineering, cloud computing, and AI certifications.`,
      ``,
      `🏢 Main Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
      `🌐 Official Portal: https://www.softlabglobal.com`,
      `🎓 LMS & Student Hub: https://lms.softlabglobal.com`,
      `📞 Helpline: +91 9196596979`,
      ``,
      `=========================================`,
      `PROGRAM HIGHLIGHTS`,
      `• 100% Practical Hands-on Labs & Capstone Projects`,
      `• 1,200+ Corporate Hiring Partners & Dedicated Placement Cell`,
      `• Official ISO & University Certification`,
      ``,
      `DISCLAIMER: This educational session is recorded for authorized enrolled learners of SoftLab Global. Unauthorized reproduction, distribution or re-uploading without written consent is strictly prohibited.`,
      ``,
      `#SoftLabGlobal #SoftwareEngineering #TechEducation #FullStack #AI #Prayagraj`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Generates an SVG/Data-URL thumbnail with SoftLab Global visual branding
   */
  public static generateThumbnailSvg(params: {
    courseTitle: string;
    lectureTopic: string;
    trainerName: string;
  }): string {
    const safeCourse = params.courseTitle.replace(/&/g, "&amp;").slice(0, 45);
    const safeTopic = params.lectureTopic.replace(/&/g, "&amp;").slice(0, 60);
    const safeTrainer = params.trainerName.replace(/&/g, "&amp;").slice(0, 30);

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617" />
            <stop offset="40%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#bg)" />
        <circle cx="1150" cy="100" r="300" fill="#4338ca" opacity="0.15" />
        <circle cx="100" cy="650" r="250" fill="#d97706" opacity="0.1" />

        <!-- Brand Header -->
        <rect x="80" y="70" width="8" height="42" fill="#fbbf24" rx="4" />
        <text x="105" y="102" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#ffffff" letter-spacing="2">
          SOFTLAB GLOBAL
        </text>
        <text x="365" y="102" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#fbbf24">
          ACADEMIC MASTERCLASS
        </text>

        <!-- Course Title Badge -->
        <rect x="80" y="160" width="700" height="48" fill="#1e293b" rx="8" stroke="#334155" stroke-width="1.5" />
        <text x="105" y="192" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#38bdf8">
          ${safeCourse}
        </text>

        <!-- Lecture Topic Title -->
        <text x="80" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#ffffff">
          ${safeTopic}
        </text>

        <!-- Faculty Badge -->
        <g transform="translate(80, 560)">
          <rect width="400" height="70" fill="#0f172a" rx="12" stroke="#4338ca" stroke-width="2" />
          <text x="25" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#94a3b8">
            SESSION INSTRUCTOR
          </text>
          <text x="25" y="54" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#ffffff">
            ${safeTrainer}
          </text>
        </g>

        <!-- Campus Watermark -->
        <text x="1200" y="660" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748b" text-anchor="end">
          Civil Lines, Prayagraj • lms.softlabglobal.com
        </text>
      </svg>
    `.trim();
  }

  /**
   * Enqueues a finalized class recording into the YouTube publication queue
   */
  public static async enqueueRecordingForPublishing(recordingId: string): Promise<{
    queued: boolean;
    reason?: string;
    queueItem?: any;
  }> {
    const recording = await db.classRecording.findUnique({
      where: { id: recordingId },
      include: {
        class: {
          include: {
            batch: {
              include: { course: true },
            },
            module: true,
            trainer: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!recording) return { queued: false, reason: "Recording not found" };

    // --- STRICT PRIVACY RULE ---
    // Recruiter interviews, student mock interviews, and assessment recordings
    // must NEVER be automatically or accidentally published to YouTube.
    const isExplicitClass = !!recording.class;
    if (!isExplicitClass) {
      await db.classRecording.update({
        where: { id: recording.id },
        data: { youTubePublishStatus: "BLOCKED_PRIVACY" },
      });
      return { queued: false, reason: "Recording blocked: private interview/assessment session." };
    }

    const { scheduledClass } = { scheduledClass: recording.class };
    const course = scheduledClass.batch.course;
    const moduleTitle = scheduledClass.module?.title || "Curriculum Session";
    const trainerName = scheduledClass.trainer
      ? `${scheduledClass.trainer.user.firstName} ${scheduledClass.trainer.user.lastName}`
      : "Assigned Faculty";

    // Deduplication check: check if already in queue
    const existingQueueItem = await db.youTubePublishQueue.findUnique({
      where: { recordingId },
    });

    if (existingQueueItem) {
      return { queued: true, queueItem: existingQueueItem };
    }

    const config = await this.getOAuthConfig();
    const title = this.generateTitle(course.title, moduleTitle, scheduledClass.title);
    const description = this.generateDescription({
      courseTitle: course.title,
      moduleTitle,
      lectureTopic: scheduledClass.title,
      trainerName,
      batchCode: scheduledClass.batch.code,
    });

    const queueItem = await db.youTubePublishQueue.create({
      data: {
        recordingId,
        classId: scheduledClass.id,
        courseTitle: course.title,
        moduleTitle,
        lectureTopic: scheduledClass.title,
        trainerName,
        targetPrivacy: config.defaultPrivacy || "UNLISTED",
        status: "QUEUED",
        videoTitle: title,
        videoDescription: description,
        tags: [
          "SoftLab Global",
          course.title,
          "Computer Science",
          "Coding Lecture",
          "Prayagraj",
          "Practical IT Training",
        ],
      },
    });

    await db.classRecording.update({
      where: { id: recordingId },
      data: { youTubePublishStatus: "QUEUED" },
    });

    return { queued: true, queueItem };
  }

  /**
   * Processes pending queue items and dispatches to YouTube Data API v3
   */
  public static async processPublishQueue(maxItems = 3): Promise<{
    processed: number;
    published: number;
    failed: number;
  }> {
    const items = await db.youTubePublishQueue.findMany({
      where: { status: { in: ["QUEUED", "FAILED"] }, attemptCount: { lt: 3 } },
      orderBy: { createdAt: "asc" },
      take: maxItems,
      include: { recording: true },
    });

    const config = await this.getOAuthConfig();
    let published = 0;
    let failed = 0;

    for (const item of items) {
      await db.youTubePublishQueue.update({
        where: { id: item.id },
        data: {
          status: "PROCESSING",
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      // Verify OAuth credentials
      if (!config.refreshToken || !config.clientId) {
        const err = "YouTube OAuth credentials not configured (missing YOUTUBE_CLIENT_ID / YOUTUBE_REFRESH_TOKEN).";
        await db.youTubePublishQueue.update({
          where: { id: item.id },
          data: { status: "FAILED", errorMessage: err },
        });
        await db.classRecording.update({
          where: { id: item.recordingId },
          data: { youTubePublishStatus: "FAILED" },
        });
        failed++;
        continue;
      }

      try {
        // Exchange refresh token for fresh access token with Google OAuth2
        const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret || "",
            refresh_token: config.refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const tokenData = await tokenResp.json();
        if (!tokenResp.ok || !tokenData.access_token) {
          throw new Error(`Google OAuth token refresh failed: ${tokenData.error_description || JSON.stringify(tokenData)}`);
        }

        const accessToken = tokenData.access_token;

        // Perform YouTube Video Metadata Registration via official YouTube Data API v3
        // Initializes video resource in channel
        const uploadResp = await fetch(
          "https://www.googleapis.com/youtube/v3/videos?part=snippet,status",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              snippet: {
                title: item.videoTitle,
                description: item.videoDescription,
                tags: item.tags,
                categoryId: "27", // Education category
              },
              status: {
                privacyStatus: item.targetPrivacy.toLowerCase(),
                selfDeclaredMadeForKids: false,
              },
            }),
          }
        );

        const uploadData = await uploadResp.json();

        if (uploadResp.ok && uploadData.id) {
          const videoId = uploadData.id;
          const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

          await db.youTubePublishQueue.update({
            where: { id: item.id },
            data: {
              status: "PUBLISHED",
              youTubeVideoId: videoId,
              youTubeUrl: canonicalUrl,
              publishedAt: new Date(),
              errorMessage: null,
            },
          });

          await db.classRecording.update({
            where: { id: item.recordingId },
            data: {
              isPublishedToYouTube: true,
              youTubePublishStatus: "PUBLISHED",
              youTubeVideoId: videoId,
              youTubeUrl: canonicalUrl,
            },
          });

          published++;
        } else {
          const errMsg = uploadData.error?.message || "YouTube API upload error";
          await db.youTubePublishQueue.update({
            where: { id: item.id },
            data: {
              status: "FAILED",
              errorMessage: errMsg,
            },
          });
          failed++;
        }
      } catch (procErr: any) {
        await db.youTubePublishQueue.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            errorMessage: procErr.message,
          },
        });
        failed++;
      }
    }

    return { processed: items.length, published, failed };
  }
}
