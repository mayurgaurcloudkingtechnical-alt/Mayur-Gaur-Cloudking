import { NextRequest, NextResponse } from "next/server";
import { YouTubePublishingService } from "@/server/services/youtube/youtube-publishing.service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const host = request.headers.get("x-forwarded-host") || request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || (request.nextUrl.protocol.replace(":", "") || "https");
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || "https://lms.softlabglobal.com");

  // If user declined or Google returned an error
  if (error) {
    const errorMsg = errorDescription || error;
    console.error(`[YouTube OAuth Callback Error]: ${errorMsg}`);
    return NextResponse.redirect(
      new URL(`/admin/youtube?connection=error&message=${encodeURIComponent(errorMsg)}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        `/admin/youtube?connection=error&message=${encodeURIComponent("Missing authorization code or state token")}`,
        baseUrl
      )
    );
  }

  try {
    const redirectUri =
      process.env.YOUTUBE_REDIRECT_URI || `${baseUrl}/api/auth/youtube/callback`;

    const result = await YouTubePublishingService.handleOAuthCallback({
      code,
      state,
      redirectUri,
    });

    return NextResponse.redirect(
      new URL(
        `/admin/youtube?connection=success&channel=${encodeURIComponent(result.channelTitle)}`,
        baseUrl
      )
    );
  } catch (err: any) {
    console.error("[YouTube OAuth Callback Exception]:", err);
    return NextResponse.redirect(
      new URL(
        `/admin/youtube?connection=error&message=${encodeURIComponent(err.message || "Failed to authorize YouTube channel")}`,
        baseUrl
      )
    );
  }
}
