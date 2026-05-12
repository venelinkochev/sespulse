import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error === "1";
  const next = sp.next ?? "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="h-9 w-9 rounded-md bg-accent/20 ring-1 ring-accent/40 flex items-center justify-center text-accent font-bold">
            S
          </div>
          <div className="text-lg font-semibold tracking-tight">SESPulse</div>
        </div>

        <form
          action={loginAction}
          className="rounded-lg border border-border bg-bg-card p-6 space-y-4"
        >
          <h1 className="text-lg font-semibold">Sign in</h1>

          <input type="hidden" name="next" value={next} />

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-fg-subtle">
              Username
            </span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              autoFocus
              className="mt-1 w-full rounded-md border border-border bg-bg-subtle px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-fg-subtle">
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-border bg-bg-subtle px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>

          {error && (
            <div className="rounded-md border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-sm text-accent-red">
              Invalid username or password.
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#0a0d18] hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
