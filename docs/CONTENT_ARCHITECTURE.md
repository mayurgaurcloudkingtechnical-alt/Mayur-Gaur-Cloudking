# SOFTLAB GLOBAL — Course Content Management & Secure Media Architecture

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Content Hierarchy:** Course → Module → Lesson → Pedagogical Content  
> **Media Delivery:** Zero Public S3 Buckets, Signed Ephemeral Tokens, Tokenized HLS DRM Video

---

## 1. Content Hierarchy & Publishing Invariance

Course delivery in SOFTLAB GLOBAL follows a strict 3-tier hierarchy:

```
┌───────────────────────────────────────────────────────────┐
│ Course (e.g. "Full-Stack Software Engineering Masterclass")│
│ Status: DRAFT | PUBLISHED | ARCHIVED                      │
└─────────────────────────────┬─────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
┌────────────────────────────┐ ┌────────────────────────────┐
│ Module 1: Core JavaScript  │ │ Module 2: React & Next.js  │
│ Status: DRAFT | PUBLISHED  │ │ Status: DRAFT | PUBLISHED  │
└──────────────┬─────────────┘ └──────────────┬─────────────┘
               │                              │
     ┌─────────┴─────────┐                    └───────────┐
     ▼                   ▼                                ▼
┌──────────────┐   ┌──────────────┐                 ┌──────────────┐
│ Lesson 1     │   │ Lesson 2     │                 │ Lesson 3     │
│ (VIDEO: HLS) │   │ (PDF Slides) │                 │ (Quiz Test)  │
│ PUBLISHED    │   │ PUBLISHED    │                 │ DRAFT        │
└──────────────┘   └──────────────┘                 └──────────────┘
```

### The Student Visibility Rule
A student can access a lesson **if and only if** all four conditions evaluate to true on the server:
1. `Course.status === 'PUBLISHED'`
2. `Module.status === 'PUBLISHED'`
3. `Lesson.status === 'PUBLISHED'`
4. An active `Enrollment` record exists linking the authenticated student's profile to the course (unless `Lesson.isFreePreview === true`).

If any parent container is in `DRAFT` or `ARCHIVED` status, or the student is not actively enrolled, the API throws `FORBIDDEN`.

---

## 2. Supported Lesson Content Types

| Content Type | Primary Storage | Client Delivery Mechanism | Security / DRM Strategy |
|---|---|---|---|
| `VIDEO` | Bunny.net Stream / Cloudflare | Ephemeral HLS token with 10-minute expiry | Token authenticated with SHA-256 HMAC & client IP |
| `PDF` | Private S3 / Cloudflare R2 | Presigned GET download URL (15-minute expiry) | No public bucket policy; direct S3 streaming |
| `DOCUMENT` | Private S3 / Cloudflare R2 | Presigned GET download URL (15-minute expiry) | Download only; signed with short TTL |
| `RICH_TEXT` | PostgreSQL `bodyHtml` (Text) | Rendered directly inside LMS viewer | Sanitized via DOMPurify to eliminate script injection |
| `ASSIGNMENT`| S3/R2 Submissions Bucket | Presigned PUT upload URL + Student submission | File type whitelist (`.zip`, `.pdf`), max size 25MB |
| `QUIZ` | PostgreSQL `question_bank` | Interactive tRPC exam engine | Randomized question sequence, client-side timer |
| `TEST` | PostgreSQL `question_bank` | Proctored timed test with attempt limits | Server-recorded start/submit timestamps |

---

## 3. Secure File Upload Architecture (Direct-to-Cloud)

At no point do massive video files, heavy PDF manuals, or student assignment zip files stream through the Next.js application server. This eliminates memory saturation and CPU bottlenecks.

```
[ Trainer / Student Browser ]
             │
             │ 1. Request Presigned Upload URL
             │    tRPC: `content.getPresignedUploadUrl({ lessonId, mimeType, fileSize })`
             ▼
[ Next.js API Gateway ]
             │
             │ 2. Server Validates Permissions:
             │    - Is Trainer assigned to this Course?
             │    - Is MIME type allowed (application/pdf, application/zip)?
             │    - Is file size within limits (<= 50MB)?
             ▼
[ Storage Adapter (@aws-sdk/s3-request-presigner) ]
             │
             │ 3. Generates Presigned PUT URL with 5-minute TTL
             ▼
[ Next.js API Gateway ]
             │
             │ 4. Returns { uploadUrl, storageFileKey } to Browser
             ▼
[ Trainer / Student Browser ]
             │
             │ 5. Direct HTTP PUT Binary Upload (Progress Bar in UI)
             ▼
[ Cloudflare R2 / AWS S3 Private Bucket ]
             │
             │ 6. Upload Complete (HTTP 200 OK from S3)
             ▼
[ Trainer / Student Browser ]
             │
             │ 7. Notify Server: `content.confirmUpload({ lessonId, storageFileKey })`
             ▼
[ Next.js API Gateway ]
             │
             │ 8. Verifies object existence via HeadObjectCommand
             │    Updates `LessonContent.storageFileKey` in PostgreSQL
             ▼
[ Database Updated ]
```

---

## 4. Video Protection & Signed Playback Architecture

To prevent unauthorized ripping, screen recording distribution, and unauthorized link sharing of high-value IT lectures:

```
[ Enrolled Student Opens Video Lesson ]
                   │
                   │ 1. Calls `lms.getVideoPlaybackToken({ lessonId })`
                   ▼
       [ Next.js API Layer ]
                   │
                   │ 2. Server checks:
                   │    - Is user logged in?
                   │    - Is course/module/lesson PUBLISHED?
                   │    - Is student enrolled in this course?
                   ▼
       [ Bunny.net Video Adapter ]
                   │
                   │ 3. Compute Ephemeral SHA-256 Signature Token:
                   │    token = SHA256(TOKEN_KEY + videoId + expiresAt + clientIP)
                   │    expiresAt = currentTimestamp + 600 (10 minutes)
                   ▼
       [ Next.js API Layer ]
                   │
                   │ 4. Return { videoId, libraryId, token, expiresAt }
                   ▼
       [ Student LMS Video Player ]
                   │
                   │ 5. Embeds Custom HLS Player (Video.js / Bunny Player)
                   │    URL: https://video.softlabglobal.com/{videoId}/playlist.m3u8?token={token}&expires={expiresAt}
                   ▼
       [ Bunny.net Edge CDN ]
                   │
                   │ 6. Edge validates signature before delivering HLS video chunks
                   ▼
       [ Fluid 1080p Streaming with Student Dynamic Email Watermark Overlay ]
```

### Video Watermarking
The student LMS video player component overlays a semi-transparent, moving watermark across the canvas containing the authenticated student's **Student ID**, **Email**, and **Current Timestamp**. This strongly deters camcording and external screen-recording leaks.

---

## 5. Course Authoring & Trainer Scoping Rules

To prevent accidental data corruption or unauthorized course editing by faculty:

1. **Explicit Trainer Assignment**: A user with the `TRAINER` role cannot edit all courses. They must be explicitly mapped to the course via the `CourseTrainer` join table.
2. **Restricted Deletion**: Trainers cannot delete courses or modules. Only `ADMIN` or `SUPER_ADMIN` can perform deletions.
3. **No Financial Modifications**: The course `baseFee` attribute cannot be updated by a trainer. Course fee modifications are restricted to `ADMIN`, `DIRECTOR`, and `SUPER_ADMIN`.
4. **Drag-and-Drop Reordering**: Modules and lessons carry an integer `sortOrder` attribute. A mutation `content.reorderLessons` accepts an array of IDs and updates positions atomically within a database transaction.
