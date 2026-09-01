import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { slugify } from "@/types";

const SESSION_COOKIE = "agencia_session";
const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/auth/logout"]);

function getSecretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

async function readSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { nivel?: string; responsavel?: string; login?: string; sub?: string };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|img/).*)"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const session = await readSession(req);
  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session.nivel === "EXECUTOR" && !isApi) {
    const ownPath = `/mobile/${slugify(session.responsavel ?? "")}`;
    if (pathname !== ownPath && pathname !== "/minha-conta") {
      const url = req.nextUrl.clone();
      url.pathname = ownPath;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const isMaster = session.nivel === "MASTER";

  if (pathname.startsWith("/cadastrarlogin") && !isMaster) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api/usuarios") && pathname !== "/api/usuarios/me" && !isMaster) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  return NextResponse.next();
}
