import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, LockKeyhole, ServerCog, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { getAIConfigurationStatus } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Status = {
  geminiConfigured: boolean;
  provider: string;
  chatModel: string;
  voiceModel: string;
};

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const getStatus = useServerFn(getAIConfigurationStatus);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (isAdmin) void getStatus().then(setStatus);
  }, [isAdmin, getStatus]);

  if (loading) return <div className="panel p-8 text-center">Checking administrator access…</div>;
  if (!user)
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <LockKeyhole className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-extrabold">Administrator sign-in required</h1>
        <Link
          to="/login"
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground"
        >
          Sign in with Google
        </Link>
      </div>
    );
  if (!isAdmin)
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-300" />
        <h1 className="mt-4 text-xl font-extrabold">Administrator access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is signed in, but it has not been assigned the admin role.
        </p>
        <Link to="/account" className="mt-5 inline-flex text-sm font-bold text-primary">
          Return to account
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">Administrator Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Protected configuration and service health.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold">Gemini AI</h2>
          </div>
          <p
            className={`mt-4 text-sm font-bold ${status?.geminiConfigured ? "text-emerald-300" : "text-amber-300"}`}
          >
            {status?.geminiConfigured ? "Configured securely" : "Key not configured"}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            The key is stored only as a protected server secret. Its value is never displayed or
            sent to the browser.
          </p>
        </div>
        <div className="panel p-5">
          <div className="flex items-center gap-3">
            <ServerCog className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold">Guardian models</h2>
          </div>
          <p className="mt-4 text-sm font-bold">{status?.chatModel ?? "Checking…"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Voice: {status?.voiceModel ?? "Checking…"}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/5 p-5">
        <h2 className="text-sm font-extrabold">Secure key updates</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          For safety, raw API keys cannot be typed into this public web page. Add or replace{" "}
          <code className="text-cyan-300">GEMINI_API_KEY</code> in the site’s protected environment
          settings, then republish. The panel will confirm when it is active.
        </p>
      </div>
    </div>
  );
}
