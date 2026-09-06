import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import "./SignaturePad.css";

/**
 * A dependency-free signature canvas. Supports mouse, touch and pen via the
 * Pointer Events API (SRS section 3/6: "Mouse, Touch screen, Mobile devices").
 * Exposes clear()/isEmpty()/toDataURL() to the parent via ref.
 */
const SignaturePad = forwardRef(function SignaturePad({ onChange }, ref) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const lastPointRef = useRef(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const prev = ctx.getImageData
        ? canvas.toDataURL()
        : null;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "#1c2321";
      if (prev && hasInkRef.current) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = prev;
      }
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function pointerDown(e) {
    canvasRef.current.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
  }

  function pointerMove(e) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setEmpty(false);
      onChange?.(false);
    }
  }

  function pointerUp(e) {
    drawingRef.current = false;
    try {
      canvasRef.current.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasInkRef.current = false;
    setEmpty(true);
    onChange?.(true);
  }

  useImperativeHandle(ref, () => ({
    clear,
    isEmpty: () => !hasInkRef.current,
    toDataURL: () => canvasRef.current.toDataURL("image/png"),
  }));

  return (
    <div className="sigpad">
      <canvas
        ref={canvasRef}
        className="sigpad-canvas"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerLeave={pointerUp}
        role="img"
        aria-label={empty ? "Signature field, empty" : "Signature field, signed"}
      />
      {empty && <span className="sigpad-hint">Sign here</span>}
      <div className="sigpad-baseline" aria-hidden="true" />
    </div>
  );
});

export default SignaturePad;
