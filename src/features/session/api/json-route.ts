import { NextResponse } from "next/server";
import { PIN_COOKIE_NAME } from "../pin/settings-pin";
import type { SessionHttpResult } from "./session-http";

export function jsonResult<T>(result: SessionHttpResult<T>): NextResponse<T> {
  return NextResponse.json(result.body, { status: result.status });
}

export function jsonError(notice: string, status = 500) {
  return NextResponse.json({ error: "server_error", notice }, { status });
}

export function jsonResultWithUnlockCookie<T>(
  result: SessionHttpResult<T>,
  unlockCookie: string | null | undefined,
): NextResponse<T> {
  const response = jsonResult(result);
  if (unlockCookie === undefined) {
    return response;
  }
  if (unlockCookie) {
    response.cookies.set(PIN_COOKIE_NAME, unlockCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    response.cookies.set(PIN_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
