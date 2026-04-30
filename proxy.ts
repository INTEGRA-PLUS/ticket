import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Authentication disabled - bypass all checks
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
