import { NextResponse, type NextRequest } from "next/server";
import { isPhoneUserAgent } from "./lib/is-phone";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent");
  if (isPhoneUserAgent(userAgent)) {
    return NextResponse.redirect(new URL("/play", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
