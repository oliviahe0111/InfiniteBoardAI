import { createClient } from "@/lib/supabase/server";

export async function authenticateAppRouterRequest() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null };
  }

  return { user };
}
