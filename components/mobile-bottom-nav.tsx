"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home09Icon,
  Building03Icon,
  Add01Icon,
  FavouriteIcon,
  UserCircleIcon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

// Subtle iOS-style "pop" when a tab becomes active. Keyed by variant label so
// it fires only on activation, not on every re-render. Only transform is
// animated, keeping it off the layout/paint path. A short tween is used for the
// three-keyframe pop (Motion springs only support two keyframes); the springy
// feel lives on the buttons' whileTap.
const iconVariants = {
  active: { scale: [1, 1.08, 1] },
  inactive: { scale: 1 },
};
const POP_TRANSITION = { duration: 0.3, ease: "easeInOut" } as const;

// Sliding background highlight behind the active tab — a faint tint of the
// site's primary (graphite) color. A shared `layoutId` lets Motion animate it
// from the previously active tab to the new one instead of jumping. Only
// transform is animated. The element is identical on the server and client (no
// `initial`), so it never causes a hydration mismatch. Reduced-motion users get
// an instant reposition (no slide) via a zero-duration transition.
const PILL_CLASS = "pointer-events-none absolute inset-1 rounded-2xl bg-primary/10";
const PILL_TRANSITION = { type: "spring", stiffness: 380, damping: 32 } as const;

function ActivePill({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.span
      layoutId="nav-active-pill"
      transition={reduce ? { duration: 0 } : PILL_TRANSITION}
      className={PILL_CLASS}
    />
  );
}

// Native-app-style bottom tab bar, mobile only (below md). Desktop renders
// nothing (md:hidden) and is unaffected.
export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

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

  // Signed-out users can browse Home freely; any other tab prompts sign-in.
  // `session === null` = definitely signed out; `undefined` = still loading
  // (navigate optimistically and let the target page gate).
  function go(href: string, requiresAuth: boolean) {
    if (requiresAuth && session === null) {
      router.push(`/login?next=${encodeURIComponent(href)}`);
      return;
    }
    router.push(href);
  }

  function openAccount() {
    if (!session) {
      router.push("/login");
      return;
    }
    setAccountOpen(true);
  }

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0.5rem))] backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
          <TabButton icon={Home09Icon} label="Home" active={active("/")} onClick={() => go("/", false)} />
          <TabButton
            icon={Building03Icon}
            label="Listings"
            active={active("/my-listings")}
            onClick={() => go("/my-listings", true)}
          />
          <PostTab active={active("/post")} onClick={() => go("/post", true)} />
          <TabButton
            icon={FavouriteIcon}
            label="Saved"
            active={active("/saved")}
            onClick={() => go("/saved", true)}
          />
          <TabButton
            icon={UserCircleIcon}
            label="Account"
            active={accountOpen}
            onClick={openAccount}
          />
          {isAdmin && (
            <TabButton
              icon={DashboardSquare01Icon}
              label="Dashboard"
              active={active("/admin")}
              onClick={() => go("/admin", true)}
            />
          )}
        </div>
      </nav>

      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>
          <SheetBody className="pb-4">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="truncate font-medium">{session?.user.email}</p>
          </SheetBody>
          <SheetFooter>
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full"
              onClick={async () => {
                await supabase.auth.signOut();
                setAccountOpen(false);
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      whileTap={reduce ? { opacity: 0.6 } : { scale: 0.95 }}
      className="relative flex flex-1 flex-col items-center justify-center gap-1"
    >
      {active && <ActivePill reduce={reduce} />}
      <motion.span
        initial={false}
        animate={reduce ? "inactive" : active ? "active" : "inactive"}
        variants={iconVariants}
        transition={POP_TRANSITION}
        className="relative z-10 inline-flex"
      >
        <HugeiconsIcon
          icon={icon}
          strokeWidth={active ? 2.4 : 1.8}
          className={cn(
            "size-6 transition-colors duration-300",
            active ? "text-foreground" : "text-muted-foreground"
          )}
        />
      </motion.span>
      <span
        className={cn(
          "relative z-10 text-[10px] leading-none transition-colors duration-300",
          active ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}

// The primary "create" action — emphasized with a filled, slightly raised tile.
function PostTab({ active, onClick }: { active: boolean; onClick: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Post a room"
      aria-current={active ? "page" : undefined}
      whileTap={reduce ? { opacity: 0.6 } : { scale: 0.95 }}
      className="flex flex-1 flex-col items-center justify-center gap-1"
    >
      <motion.span
        initial={false}
        animate={reduce ? "inactive" : active ? "active" : "inactive"}
        variants={iconVariants}
        transition={POP_TRANSITION}
        className={cn(
          "-mt-1 flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md",
          active && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
        )}
      >
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="size-5.5" />
      </motion.span>
      <span
        className={cn(
          "text-[10px] leading-none transition-colors duration-300",
          active ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        Post
      </span>
    </motion.button>
  );
}
