/**
 * Minimal Upstash Redis REST client (also speaks Vercel KV). Configured via
 * UPSTASH_REDIS_REST_URL/TOKEN — or the KV_REST_API_URL/TOKEN names the
 * Vercel marketplace integration injects. Callers must check
 * redisConfigured() first.
 *
 * Every call is bounded by REDIS_TIMEOUT_MS: a hung Upstash must degrade the
 * same way a down one does, or a slow cache would stall every card render.
 */

const REDIS_TIMEOUT_MS = 2_000;

function restUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
}

function restToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
}

export function redisConfigured(): boolean {
  return Boolean(restUrl() && restToken());
}

export async function redis(cmd: string[]): Promise<unknown> {
  const res = await fetch(restUrl() as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${restToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
    signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}
