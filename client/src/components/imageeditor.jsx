import { useEffect, useMemo, useRef, useState } from 'react';
import './image-editor.css';

// The frame has the same 3:2 shape as the catalogue cards, so what you see here is what visitors
// see. To change the card shape, change RATIO here, PREVIEW_W/H below, and the aspect-ratio lines
// in styles.css and image-editor.css.
const RATIO = 3 / 2; // width / height
const MAX_W = 1200; // saved photos are at most 1200 x 800
const PREVIEW_W = 480;
const PREVIEW_H = 320;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** The part of the photo that is inside the frame. Zoom 1 is the largest 4:3 area the photo allows. */
function sourceRect(img, zoom, cx, cy) {
  const fullH = Math.min(img.naturalHeight, img.naturalWidth / RATIO);
  const sh = fullH / zoom;
  const sw = sh * RATIO;
  return {
    sw,
    sh,
    x: clamp(cx - sw / 2, 0, img.naturalWidth - sw),
    y: clamp(cy - sh / 2, 0, img.naturalHeight - sh),
  };
}

/** Draw the framed area, apply brightness and contrast, and return a JPEG. */
function renderBlob(img, rect, brightness, contrast) {
  const outW = Math.min(MAX_W, Math.round(rect.sw)); // never enlarge a small photo
  const outH = Math.round(outW / RATIO);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // a transparent PNG would turn black as a JPEG
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, rect.x, rect.y, rect.sw, rect.sh, 0, 0, outW, outH);

  if (brightness !== 100 || contrast !== 100) {
    // Pixel maths instead of ctx.filter, which Safari does not support.
    const frame = ctx.getImageData(0, 0, outW, outH);
    const px = frame.data;
    const b = brightness / 100;
    const c = contrast / 100;
    for (let i = 0; i < px.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        px[i + k] = (px[i + k] * b - 127.5) * c + 127.5; // the array clamps to 0-255
      }
    }
    ctx.putImageData(frame, 0, 0);
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The photo could not be saved.'))), 'image/jpeg', 0.9);
  });
}

export default function ImageEditor({ src, onSave, onCancel }) {
  const dialogRef = useRef(null);
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const [img, setImg] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Open as a modal dialog: the browser handles focus and the Esc key.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  // Load the photo. The crossOrigin setting lets the browser read its pixels; the extra query
  // stops a cached copy that was loaded without it from being reused.
  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      setImg(image);
      setCenter({ x: image.naturalWidth / 2, y: image.naturalHeight / 2 });
    };
    image.onerror = () => setLoadError("This photo can't be opened for editing. Remove it and upload it again.");
    const remote = /^https?:/i.test(src);
    image.src = remote ? `${src}${src.includes('?') ? '&' : '?'}edit=${Date.now()}` : src;
  }, [src]);

  const rect = useMemo(() => (img ? sourceRect(img, zoom, center.x, center.y) : null), [img, zoom, center]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !rect) return;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, rect.x, rect.y, rect.sw, rect.sh, 0, 0, PREVIEW_W, PREVIEW_H);
  }, [img, rect]);

  const move = (dx, dy) => {
    if (!rect) return;
    setCenter((c) => ({ x: c.x + dx, y: c.y + dy }));
  };

  function onPointerDown(e) {
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e) {
    if (!drag.current || !rect) return;
    const shown = e.currentTarget.getBoundingClientRect().width; // photo pixels per screen pixel
    const k = rect.sw / shown;
    move(-(e.clientX - drag.current.x) * k, -(e.clientY - drag.current.y) * k);
    drag.current = { x: e.clientX, y: e.clientY };
  }
  const onPointerUp = () => {
    drag.current = null;
  };

  function onKeyDown(e) {
    if (!rect) return;
    const step = rect.sw * 0.05;
    const keys = {
      ArrowLeft: () => move(-step, 0),
      ArrowRight: () => move(step, 0),
      ArrowUp: () => move(0, -step),
      ArrowDown: () => move(0, step),
      '+': () => setZoom((z) => clamp(z + 0.1, 1, 4)),
      '=': () => setZoom((z) => clamp(z + 0.1, 1, 4)),
      '-': () => setZoom((z) => clamp(z - 0.1, 1, 4)),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  }

  function reset() {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    if (img) setCenter({ x: img.naturalWidth / 2, y: img.naturalHeight / 2 });
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const blob = await renderBlob(img, rect, brightness, contrast);
      await onSave(blob);
    } catch (err) {
      setError(err.message || 'The photo could not be saved. Try again.');
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="editor"
      aria-labelledby="editor-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onCancel();
      }}
    >
      <div className="editor-body">
        <h2 id="editor-title">Edit photo</h2>

        {loadError ? (
          <p className="notice error" role="alert">
            {loadError}
          </p>
        ) : (
          <>
            <div
              className="editor-frame"
              tabIndex={0}
              role="group"
              aria-label="Photo frame. Drag or use the arrow keys to move the photo, plus and minus to zoom."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={onKeyDown}
            >
              <canvas
                ref={canvasRef}
                width={PREVIEW_W}
                height={PREVIEW_H}
                style={{ filter: `brightness(${brightness / 100}) contrast(${contrast / 100})` }}
              />
              {!img && <span className="editor-loading">Loading photo…</span>}
            </div>
            <p className="hint">Drag the photo to move it. The frame is the shape of the catalogue cards.</p>

            <div className="editor-controls">
              <label>
                Zoom
                <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                <output>{Math.round(zoom * 100)}%</output>
              </label>
              <label>
                Brightness
                <input type="range" min="50" max="150" step="1" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
                <output>{brightness}%</output>
              </label>
              <label>
                Contrast
                <input type="range" min="50" max="150" step="1" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
                <output>{contrast}%</output>
              </label>
            </div>
          </>
        )}

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <div className="row">
          <button type="button" className="btn btn-primary" onClick={save} disabled={!img || saving}>
            {saving ? 'Saving…' : 'Save photo'}
          </button>
          <button type="button" className="btn btn-quiet" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          {!loadError && (
            <button type="button" className="btn btn-quiet" onClick={reset} disabled={!img || saving}>
              Reset
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}