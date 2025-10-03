import { createErrorResponse } from "../_utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  if (type === "400") {
    return createErrorResponse(400, "Bad request test", "test_bad_request");
  } else if (type === "500") {
    return createErrorResponse(500, "Server error test", "test_server_error");
  }

  return createErrorResponse(404, "Not found test", "test_not_found");
}
