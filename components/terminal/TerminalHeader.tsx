import { UserButton } from "@clerk/nextjs";

type TerminalHeaderProps = {
  email: string;
};

export default function TerminalHeader({ email }: TerminalHeaderProps) {
  return (
    <header className="mb-6 rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Vision Terminal
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Trading Workspace
          </h1>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-400">
            {email}
          </div>

          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}