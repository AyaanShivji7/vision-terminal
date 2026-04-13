import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">
            Vision Terminal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">Create account</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Start your Vision Terminal access.
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            fallbackRedirectUrl="/terminal"
            signInUrl="/sign-in"
            appearance={{
              elements: {
                card: "bg-transparent shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-white/10 bg-black text-white hover:bg-zinc-900",
                formButtonPrimary: "bg-white text-black hover:bg-zinc-200",
                footerActionLink: "text-white hover:text-zinc-300",
                formFieldInput: "bg-black border border-white/10 text-white",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}