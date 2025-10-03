import { NextResponse } from "next/server";

export function createErrorResponse(
  status: number,
  message: string,
  code: string
) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function parseJsonBody(request: Request) {
  return await request.json();
}

export function handleCORS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
