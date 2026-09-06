import { useEffect, useRef } from "react";
import QRCode from "qrcode";

/** Renders a QR code containing the client's unique signing URL (SRS section 9). */
export default function QrCode({ value, size = 176 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#1c2321", light: "#00000000" },
    });
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} aria-label="QR code for signing link" />;
}
