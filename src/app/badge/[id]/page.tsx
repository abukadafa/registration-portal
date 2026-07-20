"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import BadgeCard from "@/components/BadgeCard";
import { getParticipant } from "@/lib/participants";
import type { Participant } from "@/lib/types";

export default function BadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getParticipant(id)
      .then(setParticipant)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const node = document.getElementById("badge-card");
      if (!node) return;
      const canvas = await html2canvas(node, { scale: 3, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [canvas.width / 3, canvas.height / 3],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`${participant?.badgeNumber ?? "badge"}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-14">
        {loading && <p className="text-sm text-[var(--color-ink-soft)]">Loading your badge…</p>}

        {!loading && !participant && (
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-xl text-[var(--color-ink)]">
              We couldn&rsquo;t find that badge.
            </p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Double-check the link, or{" "}
              <Link href="/register" className="text-[var(--color-forest)] underline">
                register again
              </Link>
              .
            </p>
          </div>
        )}

        {participant && (
          <>
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">
              Registration complete
            </p>
            <h1 className="mt-2 mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
              Here&rsquo;s your accreditation badge
            </h1>

            <BadgeCard participant={participant} />

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-full bg-[var(--color-forest)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-forest-deep)] disabled:opacity-60"
              >
                {downloading ? "Preparing PDF…" : "Download badge as PDF"}
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-full border border-[var(--color-forest)] px-6 py-3 text-sm font-medium text-[var(--color-forest)] transition hover:bg-white"
              >
                Print badge
              </button>
            </div>

            <p className="mt-6 max-w-sm text-center text-xs text-[var(--color-ink-soft)]">
              Save this page&rsquo;s link — it&rsquo;s your personal badge and QR code for check-in
              at every session. Registration status:{" "}
              <span className="font-medium">{participant.registrationStatus}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
