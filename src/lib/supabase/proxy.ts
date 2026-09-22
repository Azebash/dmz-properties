import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

function redirectWithSessionCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  destination: string,
) {
  const response = NextResponse.redirect(new URL(destination, request.url));
  for (const cookie of sessionResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = sessionResponse.headers.get(header);
    if (value) response.headers.set(header, value);
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";
  const isAccessDenied = path === "/admin/access-denied";

  if (!isSupabaseConfigured()) {
    if (!isLogin) {
      return NextResponse.redirect(new URL("/admin/login?setup=required", request.url));
    }
    return NextResponse.next({ request });
  }

  const { url, publishableKey } = getSupabaseConfig();
  let sessionResponse = NextResponse.next({ request });
  const accumulatedCookies = new Map<
    string,
    { name: string; value: string; options: Parameters<typeof sessionResponse.cookies.set>[2] }
  >();
  const accumulatedHeaders = new Map<string, string>();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          accumulatedCookies.set(name, { name, value, options });
        }
        for (const [key, value] of Object.entries(cacheHeaders)) {
          accumulatedHeaders.set(key, value);
        }

        const nextResponse = NextResponse.next({ request });
        for (const { name, value, options } of accumulatedCookies.values()) {
          nextResponse.cookies.set(name, value, options);
        }
        for (const [key, value] of accumulatedHeaders) {
          nextResponse.headers.set(key, value);
        }
        sessionResponse = nextResponse;
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const signedIn = !error && Boolean(data?.claims?.sub);

  if (!signedIn && !isLogin) {
    const next = encodeURIComponent(`${path}${request.nextUrl.search}`);
    return redirectWithSessionCookies(
      request,
      sessionResponse,
      `/admin/login?next=${next}`,
    );
  }

  if (signedIn && isLogin) {
    return redirectWithSessionCookies(request, sessionResponse, "/admin");
  }

  if (isAccessDenied || isLogin || signedIn) return sessionResponse;
  return sessionResponse;
}
