import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function SiteHeader() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
        <div className="w-40" />

        <div className="flex items-center justify-center">
          <Link href="/" className="text-2xl font-bold tracking-wide text-white">
            Vision Terminal
          </Link>
        </div>

        <div className="flex w-40 items-center justify-end gap-3">
          <Link
            href="/pricing"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black"
          >
            Pricing
          </Link>

          {isSignedIn ? (
            <Link
              href="/terminal"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Enter
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Terminal
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}