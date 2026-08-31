import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Chrome, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, loading, error, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void navigate({ to: "/account" });
  }, [user, navigate]);

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="panel overflow-hidden p-6 text-center sm:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/40 bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">Guardian Account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in to protect your profile, save progress and access approved Guardian tools.
        </p>

        <button
          type="button"
          disabled={loading || busy}
          onClick={() => {
            setBusy(true);
            setMessage(null);
            void signInWithGoogle().catch((signInError) => {
              setBusy(false);
              setMessage(
                signInError instanceof Error
                  ? signInError.message
                  : "Google sign-in could not start.",
              );
            });
          }}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Chrome className="h-5 w-5" />}
          Continue with Google
        </button>

        {(message || error) && (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
            {message || error}
          </p>
        )}
        <p className="mt-5 text-xs text-muted-foreground">
          The game remains playable without an account.{" "}
          <Link to="/home" className="font-bold text-primary">
            Return home
          </Link>
        </p>
      </div>
    </div>
  );
}
