import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Límites por ruta (ventana deslizante)
const limits = {
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "15 m"), // 10 intentos cada 15 min
    prefix: "rl:auth",
  }),
  checkins: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 check-ins por hora
    prefix: "rl:checkins",
  }),
  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/min para el resto
    prefix: "rl:api",
  }),
};

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  let limiter: Ratelimit;

  if (pathname.startsWith("/api/auth/")) {
    limiter = limits.auth;
  } else if (pathname.startsWith("/api/checkins")) {
    limiter = limits.checkins;
  } else {
    limiter = limits.api;
  }

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Inténtalo más tarde." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(reset));
  return res;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/checkins/:path*", "/api/:path*"],
};
