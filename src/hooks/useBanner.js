import { useState, useEffect } from 'react';

// ── CONFIG ─────────────────────────────────────────────────────────────────
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGcOPYCS6v4m4cGWDhbJs_PZRWysSbseKBq7mF6bqbnlmEpEMB7yQDrV9hm2rTXDZnkUDeDinIT04A/pub?gid=0&single=true&output=csv';
// Sheet kolumner (rad 2):
//   A: message    — brödtext
//   B: start      — YYYY-MM-DD
//   C: end        — YYYY-MM-DD
//   D: active     — TRUE / FALSE
//   E: link_text  — (valfri) synlig länktext, t.ex. "Klicka här för att Swisha"
//   F: link_url   — (valfri) URL, t.ex. https://app.swish.nu/...
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
  const [banner,  setBanner]  = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(csv => {
        const rows = csv.trim().split('\n');
        if (rows.length < 2) return;

        const cells = parseCSVRow(rows[1]);
        const [message, start, end, active, linkText, linkUrl] = cells;

        if (!message || active?.toUpperCase() !== 'TRUE') return;

        const today = todayStr();
        if (today < start || today > end) return;

        if (localStorage.getItem(dismissKey(message))) return;

        setBanner({
          message,
          linkText: linkText || null,
          linkUrl:  linkUrl  || null,
        });
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    if (banner) localStorage.setItem(dismissKey(banner.message), '1');
    setVisible(false);
  };

  return { banner, visible, dismiss };
}
