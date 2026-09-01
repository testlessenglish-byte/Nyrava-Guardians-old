import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  deleteAIProviderKey,
  getAIConfigurationStatus,
  saveAIProviderKey,
} from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Secure Admin Console — Nyrava Guardians" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type ProviderId = "gemini" | "groq";
type ProviderStatus = {
  provider: ProviderId;
  label: string;
  configured: boolean;
  source: "admin-panel" | "environment" | null;
  lastFour: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  validatedAt: string | null;
};
type Status = {
  storageReady: boolean;
  administrator?: string;
  providers: ProviderStatus[];
};

const providerDetails: Record<ProviderId, { description: string; placeholder: string; use: string }> = {
  gemini: {
    description: "Guardian conversations, teaching explanations and classroom voice.",
    placeholder: "Paste your Gemini API key",
    use: "Primary classroom intelligence",
  },
  groq: {
    description: "Fast fallback responses, hints and lightweight learning activities.",
    placeholder: "Paste your Groq API key",
    use: "Fast fallback provider",
  },
};

function dateLabel(value: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function AdminPage() {
  const { user, session, loading, isAdmin } = useAuth();
  const getStatus = useServerFn(getAIConfigurationStatus);
  const saveKey = useServerFn(saveAIProviderKey);
  const deleteKey = useServerFn(deleteAIProviderKey);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<ProviderId | "status" | null>(null);
  const [keys, setKeys] = useState<Record<ProviderId, string>>({ gemini: "", groq: "" });
  const [visible, setVisible] = useState<Record<ProviderId, boolean>>({ gemini: false, groq: false });
  const accessToken = session?.access_token ?? "";

  const configuredCount = useMemo(
    () => status?.providers.filter((provider) => provider.configured).length ?? 0,
    [status],
  );

  async function refresh() {
    if (!accessToken) return;
    setBusy("status");
    setError(null);
    try {
      setStatus(await getStatus({ data: { accessToken } }));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Admin status could not load.");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (isAdmin && accessToken) void refresh();
  }, [isAdmin, accessToken]);

  if (loading) return <div className="panel p-8 text-center">Checking administrator access…</div>;
  if (!user)
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <LockKeyhole className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-extrabold">Administrator sign-in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your approved Nyrava administrator account.
        </p>
        <Button asChild className="mt-5">
          <Link to="/login">Open secure sign in</Link>
        </Button>
      </div>
    );
  if (!isAdmin)
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-300" />
        <h1 className="mt-4 text-xl font-extrabold">Administrator access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user.email} is signed in but is not on the administrator allowlist.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/account">Return to account</Link>
        </Button>
      </div>
    );

  const administratorEmail = user.email ?? "Admin";

  async function save(provider: ProviderId) {
    const apiKey = keys[provider].trim();
    if (!apiKey) {
      toast.error(`Paste a ${provider === "gemini" ? "Gemini" : "Groq"} API key.`);
      return;
    }
    setBusy(provider);
    try {
      const next = await saveKey({ data: { accessToken, provider, apiKey } });
      setStatus((current) => ({ ...next, administrator: current?.administrator ?? administratorEmail }));
      setKeys((current) => ({ ...current, [provider]: "" }));
      setVisible((current) => ({ ...current, [provider]: false }));
      toast.success(`${provider === "gemini" ? "Gemini" : "Groq"} key validated and protected.`);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "The API key could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(provider: ProviderId) {
    setBusy(provider);
    try {
      const next = await deleteKey({ data: { accessToken, provider } });
      setStatus((current) => ({ ...next, administrator: current?.administrator ?? administratorEmail }));
      toast.success(`${provider === "gemini" ? "Gemini" : "Groq"} key removed.`);
    } catch (removeError) {
      toast.error(removeError instanceof Error ? removeError.message : "The API key could not be removed.");
    } finally {
      setBusy(null);
    }
  }

  const providers = status?.providers ?? [
    { provider: "gemini" as const, label: "Gemini", configured: false },
    { provider: "groq" as const, label: "Groq", configured: false },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/15 via-background to-violet-500/10 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300">
              <ShieldCheck className="h-4 w-4" /> Verified administrator
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Nyrava Control Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Connect the protected AI services that power Guardian teaching, voice and learning tools.
              Saved keys are encrypted and can never be displayed again.
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3 backdrop-blur">
            <p className="text-xs font-bold text-muted-foreground">Service readiness</p>
            <p className="mt-1 text-2xl font-black">{configuredCount} / 2</p>
            <p className="text-xs text-muted-foreground">AI providers connected</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      {status && !status.storageReady && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Secure panel storage is waiting for the new deployment. Existing protected environment keys
          remain available, but saving from this page will activate after publishing.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {providers.map((provider) => {
          const id = provider.provider;
          const full = provider as ProviderStatus;
          const details = providerDetails[id];
          const working = busy === id;
          return (
            <Card key={id} className="overflow-hidden border-border/80 bg-card/80 shadow-xl">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
                      <KeyRound className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black">{provider.label}</CardTitle>
                      <CardDescription className="mt-1">{details.use}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      provider.configured
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border-amber-400/40 bg-amber-400/10 text-amber-200"
                    }
                  >
                    {provider.configured ? "Connected" : "Needs key"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{details.description}</p>

                {provider.configured && (
                  <div className="grid gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-xs sm:grid-cols-2">
                    <div>
                      <p className="font-bold text-muted-foreground">Protected key</p>
                      <p className="mt-1 font-mono font-black text-emerald-200">•••• •••• {full.lastFour}</p>
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground">Last validated</p>
                      <p className="mt-1 font-bold">{dateLabel(full.validatedAt)}</p>
                    </div>
                    {full.updatedBy && (
                      <div className="sm:col-span-2">
                        <p className="font-bold text-muted-foreground">Last changed by</p>
                        <p className="mt-1 font-bold">{full.updatedBy}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground" htmlFor={`${id}-key`}>
                    {provider.configured ? "Replace API key" : "API key"}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id={`${id}-key`}
                      type={visible[id] ? "text" : "password"}
                      autoComplete="off"
                      spellCheck={false}
                      value={keys[id]}
                      onChange={(event) => setKeys((current) => ({ ...current, [id]: event.target.value }))}
                      placeholder={details.placeholder}
                      className="h-11 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={() => setVisible((current) => ({ ...current, [id]: !current[id] }))}
                      aria-label={visible[id] ? "Hide API key" : "Show API key while typing"}
                    >
                      {visible[id] ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    The key is sent only to the protected server, validated with {provider.label}, encrypted,
                    and cleared from this form.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    className="h-11 flex-1 font-extrabold"
                    disabled={working || !keys[id].trim() || status?.storageReady === false}
                    onClick={() => void save(id)}
                  >
                    {working ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    Validate & {provider.configured ? "replace" : "save"}
                  </Button>
                  {provider.configured && full.source === "admin-panel" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="outline" className="h-11 text-red-200">
                          <Trash2 /> Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove the {provider.label} key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Guardian features using this provider will stop until another valid key is saved.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep key</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-500"
                            onClick={() => void remove(id)}
                          >
                            Remove protected key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <LockKeyhole className="h-5 w-5 text-cyan-300" />
          <h2 className="mt-3 text-sm font-extrabold">Write-only secrets</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Keys are never returned to the browser after saving.</p>
        </div>
        <div className="panel p-5">
          <ServerCog className="h-5 w-5 text-violet-300" />
          <h2 className="mt-3 text-sm font-extrabold">Server-side access</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Only verified admins can read status or change providers.</p>
        </div>
        <div className="panel p-5">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <h2 className="mt-3 text-sm font-extrabold">Live validation</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Invalid keys are rejected before anything is stored.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Signed in securely as {status?.administrator ?? user.email}</span>
        <Button type="button" variant="ghost" size="sm" disabled={busy === "status"} onClick={() => void refresh()}>
          <RefreshCw className={busy === "status" ? "animate-spin" : ""} /> Refresh service status
        </Button>
      </div>
    </div>
  );
}
