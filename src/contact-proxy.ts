import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy to the backend's public contact endpoint
 * (POST {API}/api/contact/submit → ContactMessage → CMS "Mensajes" → HubSpot).
 *
 * Why a proxy: the browser would otherwise call the backend cross-origin and
 * need the site's domain in the backend's CORS list (shared with every tenant).
 * Server-to-server there's no CORS. The visitor IP is forwarded so the
 * backend's per-IP rate limit still applies per visitor.
 *
 * Use from `app/api/contact/route.ts`:
 *   export { POST } from '@pisos/cms-client/contact-proxy';
 *   export const maxDuration = 60; // route segment config must be a literal in the route file
 *
 * The backend saves the lead before answering; a slow answer is still a saved
 * lead, so the fetch waits up to 55 s instead of reporting a false error
 * (seen: ~18 s once on cortina-hawaiana).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? '';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const payload = {
    name: str(body.name, 120),
    email: str(body.email, 254),
    phone: str(body.phone, 40),
    subject: str(body.subject, 200),
    message: str(body.message, 5000),
    source_slug: str(body.source_slug, 200),
    website: str(body.website, 200), // honeypot — backend drops filled ones
    // HubSpot context (backend forwards to the HubSpot Forms API)
    hutk: str(body.hutk, 100),
    page_uri: str(body.page_uri, 500),
    page_name: str(body.page_name, 200),
    tenant_slug: TENANT_SLUG,
  };

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  try {
    const res = await fetch(`${API_BASE}/api/contact/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(ip ? { 'X-Forwarded-For': ip } : {}) },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(55_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'backend_unreachable' }, { status: 502 });
  }
}
