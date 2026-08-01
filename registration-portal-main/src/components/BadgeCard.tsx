import type { Participant } from "@/lib/types";
import QRCodeCanvas from "./QRCode";

const CATEGORY_ACCENTS: Record<string, string> = {
  Speaker: "bg-[var(--color-gold)] text-[var(--color-forest-deep)]",
  Sponsor: "bg-[var(--color-forest)] text-[var(--color-gold-light)]",
  Researcher: "bg-[var(--color-forest-light)] text-white",
  "Policy Maker": "bg-[var(--color-forest-deep)] text-[var(--color-gold-light)]",
  "Industry / Private Sector": "bg-[var(--color-ink-soft)] text-white",
  Farmer: "bg-[var(--color-forest-light)] text-white",
  Student: "bg-[var(--color-cream)] text-[var(--color-forest-deep)] border border-[var(--color-forest)]",
  "Development Partner": "bg-[var(--color-forest)] text-[var(--color-gold-light)]",
  Media: "bg-[var(--color-ink-soft)] text-white",
  Other: "bg-[var(--color-cream)] text-[var(--color-forest-deep)] border border-[var(--color-forest)]",
};

export default function BadgeCard({ participant }: { participant: Participant }) {
  const accent = CATEGORY_ACCENTS[participant.category] ?? CATEGORY_ACCENTS.Other;
  const initials = `${participant.firstName[0] ?? ""}${participant.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div
      id="badge-card"
      className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5"
    >
      {/* Die-cut header strip */}
      <div className="relative bg-[var(--color-forest)] px-6 pt-5 pb-8 text-center">
        <p
          className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-[var(--color-gold-light)] uppercase"
        >
          9th AACAA · Abuja 2026
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-sm italic text-white/80">
          Repositioning Animal Agriculture
        </p>
        <div className="badge-notch absolute left-1/2 -bottom-3.5 -translate-x-1/2" />
      </div>

      {/* Perforation row simulating a die-cut lanyard tear line */}
      <div className="badge-perforation h-3 bg-[var(--color-forest)]" />

      <div className="px-6 pt-6 pb-7">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-cream)] ring-2 ring-[var(--color-gold)]">
            {participant.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={participant.photoUrl}
                alt={`${participant.firstName} ${participant.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-forest)]">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${accent}`}
            >
              {participant.category}
            </span>
            <h2 className="mt-1.5 truncate font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
              {participant.title} {participant.firstName} {participant.lastName}
            </h2>
            <p className="truncate text-sm text-[var(--color-ink-soft)]">
              {participant.organization}
            </p>
            <p className="truncate text-xs text-[var(--color-ink-soft)]">{participant.country}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--color-cream)] p-4">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]">
              Badge No.
            </p>
            <p className="font-[family-name:var(--font-mono)] text-base font-semibold text-[var(--color-forest-deep)]">
              {participant.badgeNumber}
            </p>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)]">
              Venue
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Shehu Musa Yar&rsquo;Adua Centre
            </p>
          </div>
          <QRCodeCanvas value={`9AACAA26:${participant.id}:${participant.badgeNumber}`} size={104} />
        </div>

        {/* 1D Linear Barcode */}
        <div className="mt-5 flex flex-col items-center justify-center border-t border-black/5 pt-5 text-center">
          <span className="barcode-font text-[48px] text-[var(--color-forest)] select-none leading-none">
            {`*${participant.badgeNumber}*`}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] mt-1">
            Scanner Code
          </span>
        </div>
      </div>
    </div>
  );
}
