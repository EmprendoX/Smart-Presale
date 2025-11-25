import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // En modo mock, redirigir directamente al dashboard
  const redirectUrl = new URL("/dashboard", request.url);
  return NextResponse.redirect(redirectUrl);
}



