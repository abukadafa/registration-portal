"use client";

import { useEffect, useState } from "react";
import QRCodeCanvas from "./QRCode";

export default function PortalAccessQR() {
  const [registerUrl, setRegisterUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Automatically generate URL based on current host
      setRegisterUrl(`${window.location.origin}/register`);
    }
  }, []);

  if (!registerUrl) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-md text-center max-w-sm mx-auto flex flex-col items-center gap-4">
      <div>
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-semibold">
          Mobile Access
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-forest)]">
          Scan to Register
        </h3>
        <p className="text-xs text-[var(--color-ink-soft)] mt-1">
          Scan this QR code with your phone camera to register instantly on site.
        </p>
      </div>

      <div className="p-2 bg-[var(--color-cream)] rounded-2xl flex items-center justify-center ring-4 ring-[var(--color-gold-light)]/20">
        <QRCodeCanvas value={registerUrl} size={150} />
      </div>

      <p className="text-[10px] text-black/40 font-mono select-all">
        {registerUrl}
      </p>
    </div>
  );
}
