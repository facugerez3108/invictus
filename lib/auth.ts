import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in environment variables");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export type SessionPayload = {
    userId: string;
    username: string;
    role: "ADMIN" | "USER";
}

export async function signToken(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret);
}

export async function verifyToken(token: string) {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
}

export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();

    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set("session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if(!token) return null;

    try{
        return await verifyToken(token);
    }catch {
        return null;
    }
}