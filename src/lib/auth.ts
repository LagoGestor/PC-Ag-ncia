import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// TEMP: inclui os valores antigos até a migração dos logins existentes terminar.
export type Nivel = "MASTER" | "MASTER_LEITURA" | "RESPONSAVEL_MASTER" | "RESPONSAVEL_LEITURA" | "DIRETOR_CONTEUDO" | "EXECUTOR";

export interface SessionPayload {
  sub: string;
  nome: string;
  login: string;
  nivel: Nivel;
  responsavel: string;
}

export const SESSION_COOKIE = "agencia_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ nome: payload.nome, login: payload.login, nivel: payload.nivel, responsavel: payload.responsavel })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.login || !payload.nivel) return null;
    return {
      sub: payload.sub as string,
      nome: (payload.nome as string) ?? "",
      login: payload.login as string,
      nivel: payload.nivel as Nivel,
      responsavel: (payload.responsavel as string) ?? "",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
