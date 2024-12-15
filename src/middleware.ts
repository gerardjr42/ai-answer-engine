import redis from "@/app/utils/redis";
import { Ratelimit } from "@upstash/ratelimit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // Retrieve the client's IP address for rate limiting purposes
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    // If rate limit is exceeded, return a JSON response with the error message and status code 429
    const response = success
      ? NextResponse.next()
      : NextResponse.json(
          {
            error: "Rate limit exceeded",
            message:
              "🤯 Whoa there, speedster! You've hit the brakes on our request highway. Take a quick pit stop for a minute, and then you can zoom back in! 🏎️💨",
            reset,
          },
          { status: 429 }
        );

    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    );
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
