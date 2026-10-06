import { loginAction } from "./actions";
import { LogoMark } from "@/components/Logo";

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[22rem]">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-10 w-10" />
          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            Sign in to SESPulse
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Amazon SES delivery monitoring
          </p>
        </div>

        <form action={loginAction} className="card p-6">
          {/* Next injects hidden server-action inputs at the start of the
              form, so spacing lives on this wrapper, not the form. */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-fg-muted">
                Username
              </span>
              <input
                name="username"
                type="text"
                autoComplete="username"
                required
                autoFocus
                className="input mt-1.5 w-full"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-fg-muted">
                Password
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input mt-1.5 w-full"
              />
            </label>

            {error && (
              <div className="rounded-md border border-accent-red/30 bg-accent-red/10 px-3 py-2 text-sm text-accent-red">
                Invalid username or password.
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              Sign in
            </button>
          </div>
          <input type="hidden" name="next" value={next} />
        </form>
      </div>
    </div>
  );
}
