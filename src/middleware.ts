import redis from "@/app/utils/redis";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

// Create a custom rate limit function
async function rateLimit(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message:
          "🤯 Whoa there, speedster! You've hit the brakes on our request highway. Take a quick pit stop for a minute, and then you can zoom back in! 🏎️💨",
        reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }

  return NextResponse.next();
}

// Define protected routes
const isProtectedRoute = createRouteMatcher(["/", "/chat(.*)", "/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Apply rate limiting first
  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
