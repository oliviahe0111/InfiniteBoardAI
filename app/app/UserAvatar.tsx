"use client";

import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  };
}

// Helper function to validate avatar URLs
const isValidAvatarUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // Only allow HTTPS and common avatar domains
    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.endsWith(".googleusercontent.com")
    );
  } catch {
    return false;
  }
};

export function UserAvatar({ user }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = user.user_metadata?.avatar_url;
  const isValidUrl = avatarUrl && isValidAvatarUrl(avatarUrl);
  const userName = user.user_metadata?.full_name || user.email || "User";

  // Get initials from name or email
  const getInitials = () => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="group relative">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border-2 border-white/20">
        {isValidUrl && !imageError ? (
          <Image
            src={avatarUrl}
            alt={userName}
            width={40}
            height={40}
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-sm font-semibold text-white">
            {getInitials()}
          </span>
        )}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {userName}
      </div>
    </div>
  );
}
