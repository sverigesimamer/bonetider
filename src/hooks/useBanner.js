import { useState, useEffect } from 'react';

// ── CONFIG ─────────────────────────────────────────────────────────────────
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGcOPYCS6v4m4cGWDhbJs_PZRWysSbseKBq7mF6bqbnlmEpEMB7yQDrV9hm2rTXDZnkUDeDinIT04A/pub?gid=0&single=true&output=csv';
// Sheet kolumner (en rad per meddelande, rad 2 och nedåt):
//   A: message    — brödtext
//   B: start      — YYYY-MM-DD
//   C: end        — YYYY-MM-DD
//   D: active     — TRUE / FALSE
//   E: link_text  — (valfri) synlig länktext
//   F: link_url   — (valfri) URL
// ──────────────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dismissKey(msg) {
  return `dismissed-banner-${todayStr()}-${btoa(encodeURIComponent(msg)).slice(0, 12)}`;
}

// Robust CSV parser — handles quoted fields containing commas
function parseCSVRow(row) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export function useBanner() {
  // banners = array of { id, message, linkText, linkUrl }
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const today = todayStr();

    fetch(SHEET_URL)
      .then(r => r.text())
      .then(csv => {
        const rows = csv.trim().split('\n');
        // Row 0 is header, data starts at row 1
        const dataRows = rows.slice(1);
        const active = [];

        dataRows.forEach((row, i) => {
          if (!row.trim()) return;
          const cells = parseCSVRow(row);
          const [message, start, end, activeFlag, linkText, linkUrl] = cells;

          if (!message) return;
          if (activeFlag?.toUpperCase() !== 'TRUE') return;
          if (today < start || today > end) return;

          // Each banner dismissed individually per day
          const key = dismissKey(message + i);
          if (localStorage.getItem(key)) return;

          active.push({
            id:       key,
            message,
            linkText: linkText || null,
            linkUrl:  linkUrl  || null,
          });
        });

        setBanners(active);
      })
      .catch(() => {});
  }, []);

  const dismiss = (id) => {
    localStorage.setItem(id, '1');
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  return { banners, dismiss };
}
