import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://9aacaa26abuja-nigeria.com/wp-content/uploads/2026/01/Logo-for-9aacaa-conference2.png"
            alt="9th AACAA 2026 logo"
            className="h-10 w-auto"
          />
          <div className="hidden sm:block">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold leading-tight text-[var(--color-forest)]">
              9th AACAA 2026
            </p>
            <p className="text-[11px] text-[var(--color-ink-soft)]">
              Accreditation &amp; Attendance Portal
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/register"
            className="rounded-full bg-[var(--color-forest)] px-4 py-2 font-medium text-white transition hover:bg-[var(--color-forest-deep)]"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
