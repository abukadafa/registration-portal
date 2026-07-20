"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import SiteHeader from "@/components/SiteHeader";
import { db } from "@/lib/firebase";

export default function DashboardLookupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "participants"), where("email", "==", email.trim().toLowerCase()))
      );
      if (snap.empty) {
        setError("No registration found for that email.");
        return;
      }
      router.push(`/badge/${snap.docs[0].id}`);
    } catch (err) {
      console.error(err);
      setError("Lookup failed. Check your Firebase configuration and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">
          Already registered?
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
          Find my badge
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Enter the email address you used to register.
        </p>
        <form onSubmit={handleLookup} className="mt-6 space-y-4">
          <input
            required
            type="email"
            className="input"
            placeholder="you@organization.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--color-forest)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-forest-deep)] disabled:opacity-60"
          >
            {loading ? "Searching…" : "Find my badge"}
          </button>
        </form>
      </div>
    </div>
  );
}
