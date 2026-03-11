import React, { useEffect, useRef, useState } from 'react';

// pdf.js loaded from CDN — no npm install needed
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfjsLib = null;
let loadPromise = null;

function loadPdfJs() {
  if (pdfjsLib) return Promise.resolve(pdfjsLib);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_CDN;
    script.onload = () => {
      pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return loadPromise;
}

// Cache rendered covers so we don't re-render on every mount
const coverCache = {};

export default function PdfCover({ pdfPath, bookId, width, height, fallback, style }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState(coverCache[bookId] ? 'done' : 'loading');
  const [dataUrl, setDataUrl] = useState(coverCache[bookId] || null);

  useEffect(() => {
    if (coverCache[bookId]) {
      setDataUrl(coverCache[bookId]);
      setStatus('done');
      return;
    }

    let cancelled = false;

    async function render() {
      try {
        const lib = await loadPdfJs();
        const pdf = await lib.getDocument(pdfPath).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        // Scale to fit our target size
        const scale = Math.max(width / viewport.width, height / viewport.height) * window.devicePixelRatio;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

        if (!cancelled) {
          const url = canvas.toDataURL('image/jpeg', 0.85);
          coverCache[bookId] = url;
          setDataUrl(url);
          setStatus('done');
        }
      } catch (err) {
        if (!cancelled) setStatus('error');
      }
    }

    render();
    return () => { cancelled = true; };
  }, [pdfPath, bookId, width, height]);

  const containerStyle = {
    width,
    height,
    borderRadius: style?.borderRadius ?? 8,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    ...style,
  };

  if (status === 'done' && dataUrl) {
    return (
      <div style={containerStyle}>
        <img
          src={dataUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
        />
      </div>
    );
  }

  // Loading or error — show fallback (CSS cover)
  return (
    <div style={containerStyle}>
      {fallback}
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.25)',
        }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'rgba(255,255,255,0.8)',
            animation: 'spin .7s linear infinite',
          }} />
        </div>
      )}
    </div>
  );
}
