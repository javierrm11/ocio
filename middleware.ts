import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Inicialización lazy: solo crea los limiters si Upstash está configurado
let limiters: {
  auth: Ratelimit;
  checkins: Ratelimit;
  api: Ratelimit;
} | null = null;

function getLimiters() {
  if (limiters) return limiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });

  limiters = {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      prefix: "rl:auth",
    }),
    checkins: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      prefix: "rl:checkins",
    }),
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "rl:api",
    }),
  };

  return limiters;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function middleware(req: NextRequest) {
  const l = getLimiters();

  // Sin Upstash configurado: dejar pasar sin rate limiting
  if (!l) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  const limiter =
    pathname.startsWith("/api/auth/") ? l.auth :
    pathname.startsWith("/api/checkins") ? l.checkins :
    l.api;

  try {
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
  } catch {
    // Si Redis falla, dejar pasar la petición
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/checkins/:path*", "/api/:path*"],
};
