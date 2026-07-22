import Link from "next/link";

export default function GetAppPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Add GetYourRoom to your home screen
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Get one-tap access like a normal app — no download, no app store. It opens
        full-screen with the GetYourRoom icon.
      </p>

      <section className="mt-8">
        <h2 className="text-base font-semibold">iPhone &amp; iPad (Safari)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-foreground/80">
          <li>
            Open <span className="font-medium text-foreground">getyourroom.shop</span> in
            Safari.
          </li>
          <li>
            Tap the <span className="font-medium text-foreground">Share</span> button (the
            square with an arrow) at the bottom of the screen.
          </li>
          <li>
            Scroll down and tap{" "}
            <span className="font-medium text-foreground">Add to Home Screen</span>.
          </li>
          <li>
            Tap <span className="font-medium text-foreground">Add</span> in the top corner.
          </li>
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Android (Chrome)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-foreground/80">
          <li>
            Open <span className="font-medium text-foreground">getyourroom.shop</span> in
            Chrome.
          </li>
          <li>
            Tap the <span className="font-medium text-foreground">menu (⋮)</span> in the
            top-right corner.
          </li>
          <li>
            Tap <span className="font-medium text-foreground">Add to Home screen</span> or{" "}
            <span className="font-medium text-foreground">Install app</span>. You may also
            see an automatic install prompt appear at the bottom.
          </li>
          <li>
            Confirm with <span className="font-medium text-foreground">Add</span> /{" "}
            <span className="font-medium text-foreground">Install</span>.
          </li>
        </ol>
      </section>

      <Link
        href="/"
        className="mt-10 inline-block text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        ← Back to browsing
      </Link>
    </div>
  );
}
