"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold py-2 px-5 rounded-full transition-colors"
    >
      Sign Out
    </button>
  );
}
