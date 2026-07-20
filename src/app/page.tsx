import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const stats = [
  { label: "Speakers", value: "15" },
  { label: "Sessions", value: "15" },
  { label: "Sponsors", value: "10" },
  { label: "Conference days", value: "5" },
];

const schedule = [
  { day: "Day 1", date: "9 Aug", title: "Arrival & Registration" },
  { day: "Day 2", date: "10 Aug", title: "Opening Ceremony" },
  { day: "Day 3", date: "11 Aug", title: "Technical Sessions" },
  { day: "Day 4", date: "12 Aug", title: "Technical Sessions" },
  { day: "Day 5", date: "13 Aug", title: "Closing / City Tour" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cream)]">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-forest)]">
        <div className="absolute inset-0 badge-perforation opacity-[0.06]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-20 sm:py-28">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-gold-light)]">
            Shehu Musa Yar&rsquo;Adua Centre · Abuja, Nigeria · 9&ndash;13 Aug 2026
          </p>
          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold italic leading-tight text-white sm:text-6xl">
            Repositioning Animal Agriculture for Africa&rsquo;s Food Security &amp; Global Competitiveness
          </h1>
          <p className="max-w-xl text-base text-white/75">
            The 9th All Africa Conference on Animal Agriculture (9AACAA). Register once, get
            your accreditation badge with a unique QR code, and check in at every session in
            seconds.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/register"
              className="rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-forest-deep)] transition hover:bg-[var(--color-gold-light)]"
            >
              Register for the conference
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Find my badge
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto -mt-8 grid w-full max-w-6xl grid-cols-2 gap-4 px-6 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-5 text-center shadow-lg ring-1 ring-black/5"
          >
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-forest)]">
              {s.value}
            </p>
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* Schedule */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
          Programme at a glance
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-5">
          {schedule.map((s) => (
            <div
              key={s.day}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-gold)]">
                {s.day} · {s.date}
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-ink)]">
                {s.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-black/5 bg-white py-6 text-center text-xs text-[var(--color-ink-soft)]">
        9th All Africa Conference on Animal Agriculture (AACAA) &middot; Abuja, Nigeria &middot; 2026
      </footer>
    </div>
  );
}
