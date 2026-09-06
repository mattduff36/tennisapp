import { NextResponse } from "next/server";
import type { SessionHttpResult } from "./session-http";

export function jsonResult<T>(result: SessionHttpResult<T>): NextResponse<T> {
  return NextResponse.json(result.body, { status: result.status });
}

export function jsonError(notice: string, status = 500) {
  return NextResponse.json({ error: "server_error", notice }, { status });
}
