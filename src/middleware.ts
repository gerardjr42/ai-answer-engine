//For detailed documentation, see https://clerk.com/docs/references/nextjs/clerk-middleware

import redis from "@/app/utils/redis";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit",
});

async function rateLimit(userId: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(userId);

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

const isProtectedRoute = createRouteMatcher(["/chat(.*)", "/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Apply rate limiting if user is authenticated
  if (userId) {
    const rateLimitResponse = await rateLimit(userId);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
