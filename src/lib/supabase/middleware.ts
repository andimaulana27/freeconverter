import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffRole, readUserRole } from "@/lib/auth/roles";
import { getSupabasePublicKey, getSupabaseUrl, hasSupabasePublicConfig } from "@/lib/supabase/env";

function copyAuthResponse(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

function redirectWithAuth(from: NextResponse, request: NextRequest, pathname: string, search?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (search) {
    Object.entries(search).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return copyAuthResponse(from, NextResponse.redirect(url));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPath = pathname === "/admin/login";
  const isMfaPath = pathname === "/admin/mfa";

  if (!hasSupabasePublicConfig()) {
    if (isAdminPath) {
      return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
    }
    return response;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublicKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = readUserRole(user);

  if (!isAdminPath) return response;

  if (!user) {
    if (isLoginPath) return response;
    return redirectWithAuth(response, request, "/admin/login", { next: pathname });
  }

  if (!isStaffRole(role)) {
    if (isLoginPath) return response;
    return redirectWithAuth(response, request, "/admin/login", { error: "forbidden" });
  }

  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needsMfa =
    assurance.data?.nextLevel === "aal2" && assurance.data.currentLevel !== "aal2";

  if (needsMfa && !isMfaPath && !isLoginPath) {
    return redirectWithAuth(response, request, "/admin/mfa", { next: pathname });
  }

  if (isLoginPath && !needsMfa) {
    return redirectWithAuth(response, request, "/admin");
  }

  return response;
}
