"use client";
import { useSession } from "@/components/auth/session-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserAvatar() {
  const { session } = useSession();
  const email = session?.user?.email || "user";
  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .map((s) => s[0]?.toUpperCase() || "U")
    .join("");
  return (
    <Avatar>
      <AvatarImage src={session?.user?.user_metadata?.avatar_url} alt={email} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
