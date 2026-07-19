"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const router = useRouter();
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/admin/check", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((json) => setIsAdmin(Boolean(json.isAdmin)))
      .catch(() => {});
  }, [session]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-[16.5px] font-semibold tracking-tight">
          <Image src="/logo.svg" alt="" width={35} height={35} priority />
          GetYourRoom
        </Link>
        <div className="flex items-center gap-1.5">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
              >
                <HugeiconsIcon icon={UserCircleIcon} />
                <span className="hidden sm:inline">Account</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate">{session.user.email}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/my-listings")}>
                  My listings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/saved")}>Saved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/saved-searches")}>
                  Saved searches
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>Admin</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : session === null ? (
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign in
            </Link>
          ) : null}
          <Link
            href="/post"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}
          >
            Post a room
          </Link>
        </div>
      </div>
    </header>
  );
}
