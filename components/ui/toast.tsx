"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"

import { cn } from "@/lib/utils"

// Re-export the provider + hook so callers can wrap a subtree and fire toasts.
const ToastProvider = ToastPrimitive.Provider
const useToast = ToastPrimitive.useToastManager

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()
  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "pointer-events-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl bg-foreground px-4 py-3 text-background shadow-2xl ring-1 ring-black/10",
        "transition-all duration-300 [transition-property:opacity,transform]",
        "data-[starting-style]:-translate-y-3 data-[starting-style]:opacity-0",
        "data-[ending-style]:-translate-y-3 data-[ending-style]:opacity-0"
      )}
    >
      <ToastPrimitive.Title className="text-sm font-semibold" />
      <ToastPrimitive.Description className="mt-0.5 text-sm text-background/75" />
    </ToastPrimitive.Root>
  ))
}

// Renders the toast stack. Place once inside a <ToastProvider>.
function Toaster() {
  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <ToastList />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}

export { ToastProvider, Toaster, useToast }
