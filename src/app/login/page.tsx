"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, isMock, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in, redirect to admin
  useEffect(() => {
    if (user && !loading) {
      router.push("/admin");
    }
  }, [user, loading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Invalid credentials. Please double check and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cream)]">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-xl">
          <div className="text-center">
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">
              9AACAA 2026 Portal
            </span>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold italic text-[var(--color-forest)]">
              Staff Portal Access
            </h1>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Sign in to manage registrations and scanning
            </p>
          </div>

          {/* Mode Indicator Banner */}
          <div className="mt-6">
            {isMock ? (
              <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-500/10 text-xs text-amber-800">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <span>⚠️</span> Developer Mock Mode Active
                </p>
                <p>
                  No Firebase configuration was detected. You can log in using
                  any email and password:
                </p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 font-medium">
                  <li>
                    Use <code className="font-mono bg-amber-100 px-1 rounded">admin@9aacaa.org</code> for full Admin access.
                  </li>
                  <li>
                    Use <code className="font-mono bg-amber-100 px-1 rounded">officer@9aacaa.org</code> for Registration Officer access.
                  </li>
                </ul>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-500/10 text-xs text-emerald-800 flex items-center gap-1.5 justify-center font-medium">
                <span>🔒</span> Connected to Live Firebase Auth
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                Email Address
              </label>
              <input
                required
                type="email"
                className="input"
                placeholder={isMock ? "admin@9aacaa.org" : "staff@9aacaa26abuja.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                Password
              </label>
              <input
                required
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-[var(--color-forest)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-forest-deep)] shadow-md disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Signing in…" : "Sign In to Portal"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
