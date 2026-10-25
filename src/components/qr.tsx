"use client";

import QRCode from "qrcode";
import { useMemo } from "react";

// QR Code em SVG: nítido em qualquer tela, para o aluno escanear com a câmera na academia.
export function Qr({ text, className = "" }: { text: string; className?: string }) {
  const qr = useMemo(() => {
    const code = QRCode.create(text, { errorCorrectionLevel: "L" });
    const n = code.modules.size;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (code.modules.data[y * n + x]) d += `M${x} ${y}h1v1h-1z`;
    return { d, n };
  }, [text]);
  return (
    <svg viewBox={`-4 -4 ${qr.n + 8} ${qr.n + 8}`} className={className} shapeRendering="crispEdges" role="img" aria-label="QR Code da ficha">
      <rect x="-4" y="-4" width={qr.n + 8} height={qr.n + 8} fill="#fff" />
      <path d={qr.d} fill="#0d0e0c" />
    </svg>
  );
}
