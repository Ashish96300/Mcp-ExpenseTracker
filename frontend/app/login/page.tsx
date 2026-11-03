
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d19] px-5 py-12 text-white">

      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />

      <div className="relative w-full max-w-md">

        <Link href="/" className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold text-xl">
            F
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Finora
          </span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/0.04 p-8 shadow-2xl backdrop-blur-xl sm:p-10">

          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-blue-400">
              YOUR MONEY, IN CONTROL
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Sign in to understand your spending,
              manage your finances and make smarter decisions.
            </p>
          </div>

          <a
            href="/sign-in"
            className="flex w-full items-center justify-center rounded-xl bg-blue-500 px-5 py-3.5 font-semibold transition hover:bg-blue-400"
          >
            Continue with WorkOS
          </a>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500">SECURE AUTHENTICATION</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-gray-400">
            Dont have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Create one
            </Link>
          </p>

        </div>

        <p className="mt-7 text-center text-xs text-gray-600">
          Your financial data deserves privacy and security.
        </p>

      </div>
    </main>
  );
}
