"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCodeCanvas({
  value,
  size = 160,
}: {
  value: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: {
        dark: "#0b3b2e",
        light: "#ffffff",
      },
    }).catch(() => {
      /* rendering failure is non-fatal, badge still shows badge number */
    });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-md bg-white p-1.5 shadow-sm"
      aria-label={`QR code for ${value}`}
    />
  );
}
