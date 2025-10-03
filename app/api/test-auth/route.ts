import { authenticateAppRouterRequest } from "../_auth";
import { NextResponse } from "next/server";

export async function GET() {
  const { user } = await authenticateAppRouterRequest();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Authenticated",
    userId: user.id,
    email: user.email,
  });
}
