import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import names from '../data/asmaul_husna.json';

const FAV_KEY = 'asmaul_husna_favorites';
function loadFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveFavs(set) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch {}
}

function Heart({ filled, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#e53e3e' : 'none'}
      stroke={filled ? '#e53e3e' : 'currentColor'}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

// ── Grid card — 2 columns, no Swedish, play button, rounded + shadow ──
function GridCard({ name, onPress, isFav, onToggleFav, T }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = e => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  return (
    <div style={{ position: 'relative' }}>
      <audio ref={audioRef} src={`audio/${name.nr}.mp3`} preload="none" onEnded={() => setPlaying(false)} />

      {/* Heart — top right, own tap target */}
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(); }}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: isFav ? '#e53e3e' : 'rgba(128,128,128,0.7)',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'center',
        }}
      >
        <Heart filled={isFav} size={18} />
      </button>

      {/* Card — tappable for detail */}
      <button
        onClick={onPress}
        style={{
          width: '100%',
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 22,
          boxShadow: T.isDark
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(0,0,0,0.09)',
          padding: '12px 12px 14px',
          cursor: 'pointer', textAlign: 'center',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 6, boxSizing: 'border-box',
          fontFamily: "'Inter',system-ui,sans-serif",
          transition: 'transform .1s',
        }}
      >
        {/* Number — top left */}
        <div style={{
          alignSelf: 'flex-start',
          width: 26, height: 26, borderRadius: 13,
          background: `${T.accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: T.accent,
          fontVariantNumeric: 'tabular-nums',
        }}>{name.nr}</div>

        {/* Arabic — large centre */}
        <div style={{
          fontSize: 40, lineHeight: 1.35, color: T.text,
          fontFamily: "'Scheherazade New','Traditional Arabic','Arial Unicode MS',serif",
          direction: 'rtl', minHeight: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%',
        }}>{name.arabic}</div>

        {/* Transliteration only */}
        <div style={{
          fontSize: 12, fontWeight: 700, color: T.text,
          lineHeight: 1.2, textAlign: 'center', letterSpacing: '-.1px',
        }}>{name.transliteration}</div>

        {/* Play button */}
        <button
          onClick={togglePlay}
          style={{
            marginTop: 4,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 16,
            background: playing ? T.accent : `${T.accent}18`,
            border: `1.5px solid ${T.accent}`,
            cursor: 'pointer', color: playing ? '#fff' : T.accent,
            WebkitTapHighlightColor: 'transparent',
            transition: 'all .15s',
          }}
        >
          {playing
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          }
        </button>
      </button>
    </div>
  );
}

// ── List row ──────────────────────────────────────────────────
function ListRow({ name, onPress, isFav, onToggleFav, T }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = e => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderBottom: `1px solid ${T.border}`,
      background: T.card,
      fontFamily: "'Inter',system-ui,sans-serif",
    }}>
      <audio ref={audioRef} src={`audio/${name.nr}.mp3`} preload="none" onEnded={() => setPlaying(false)} />

      <button
        onClick={onPress}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 0 13px 16px',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          WebkitTapHighlightColor: 'transparent', minWidth: 0,
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 17, flexShrink: 0,
          background: `${T.accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: T.accent,
          fontVariantNumeric: 'tabular-nums',
        }}>{name.nr}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>
            {name.transliteration}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 400, marginTop: 2, lineHeight: 1.3 }}>
            {name.swedish}
          </div>
        </div>

        <div style={{
          fontSize: 26, color: T.text, lineHeight: 1,
          fontFamily: "'Scheherazade New','Traditional Arabic','Arial Unicode MS',serif",
          direction: 'rtl', flexShrink: 0, paddingRight: 4,
        }}>{name.arabic}</div>
      </button>

      <button
        onClick={togglePlay}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 16,
          background: playing ? T.accent : `${T.accent}18`,
          border: `1.5px solid ${T.accent}`,
          cursor: 'pointer', color: playing ? '#fff' : T.accent,
          WebkitTapHighlightColor: 'transparent',
          transition: 'all .15s', flexShrink: 0, margin: '0 10px',
        }}
      >
        {playing
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
        }
      </button>

      <button
        onClick={onToggleFav}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '13px 14px', color: isFav ? '#e53e3e' : T.textMuted,
          WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}
      >
        <Heart filled={isFav} size={17} />
      </button>
    </div>
  );
}

// ── Detail screen ─────────────────────────────────────────────
function DetailScreen({ name, onBack, isFav, onToggleFav, T }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const handler = () => onBack();
    window.addEventListener('edgeSwipeBack', handler);
    return () => window.removeEventListener('edgeSwipeBack', handler);
  }, [onBack]);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  return (
    <div style={{
      background: T.bg, minHeight: '100%', display: 'flex',
      flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif",
    }}>
      <style>{`@keyframes detailIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <audio ref={audioRef} src={`audio/${name.nr}.mp3`} preload="none" onEnded={() => setPlaying(false)} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${T.border}`,
        background: T.bg, position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.accent, fontSize: 22, padding: '2px 10px 2px 0',
          WebkitTapHighlightColor: 'transparent', fontWeight: 300, lineHeight: 1,
        }}>‹</button>
        <button onClick={onToggleFav} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 6,
          color: isFav ? '#e53e3e' : T.textMuted,
          WebkitTapHighlightColor: 'transparent',
        }}>
          <Heart filled={isFav} size={24} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 48, animation: 'detailIn .22s ease both' }}>
        <div style={{ textAlign: 'center', padding: '28px 24px 20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: 22,
            background: T.accent, color: '#fff',
            fontSize: 16, fontWeight: 700, marginBottom: 16,
          }}>{name.nr}</div>

          <div style={{
            fontSize: 58, lineHeight: 1.4, color: T.text,
            fontFamily: "'Scheherazade New','Traditional Arabic','Arial Unicode MS',serif",
            direction: 'rtl', marginBottom: 14,
          }}>{name.arabic}</div>

          <div style={{
            fontSize: 22, fontWeight: 700, color: T.text,
            letterSpacing: '-.2px', marginBottom: 4,
          }}>{name.transliteration}</div>

          <div style={{ fontSize: 15, color: T.textMuted, fontWeight: 400, marginBottom: 24 }}>
            {name.swedish}
          </div>

          <button onClick={togglePlay} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: playing ? T.accent : `${T.accent}18`,
            border: `1.5px solid ${T.accent}`,
            borderRadius: 50, padding: '10px 28px',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            color: playing ? '#fff' : T.accent,
            WebkitTapHighlightColor: 'transparent',
            transition: 'all .18s',
          }}>
            {playing
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            }
            {playing ? 'Pausar' : 'Lyssna'}
          </button>
        </div>

        <div style={{ height: 1, background: T.border, margin: '0 18px 20px' }} />

        {name.forklaring && (
          <section style={{ padding: '0 18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.accent, marginBottom: 10 }}>Förklaring</div>
            <div style={{ fontSize: 15, lineHeight: 1.75, color: T.textSecondary || T.textMuted }}>{name.forklaring}</div>
          </section>
        )}

        {name.koranvers_arabiska && (
          <section style={{ padding: '0 18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.accent, marginBottom: 10 }}>Koranvers</div>
            <div style={{
              background: T.isDark ? 'rgba(45,139,120,0.1)' : 'rgba(36,100,93,0.06)',
              border: `1px solid ${T.accent}30`, borderRadius: 16, padding: '18px 16px',
            }}>
              <div style={{ fontSize: 24, lineHeight: 1.8, textAlign: 'center', color: T.text, fontFamily: "'Scheherazade New','Traditional Arabic',serif", direction: 'rtl', marginBottom: 14 }}>{name.koranvers_arabiska}</div>
              <div style={{ height: 1, background: `${T.accent}25`, marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65 }}>{name.koranvers_svenska}</div>
              {name.sura_ayat && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: T.accent }}>[{name.sura_ayat}]</div>}
            </div>
          </section>
        )}

        {name.hadith && (
          <section style={{ padding: '0 18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#C47B2B', marginBottom: 10 }}>Hadith</div>
            <div style={{ background: T.isDark ? 'rgba(196,123,43,0.1)' : 'rgba(196,123,43,0.06)', border: '1px solid rgba(196,123,43,0.25)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 14, color: T.textSecondary || T.textMuted, lineHeight: 1.7 }}>{name.hadith}</div>
            </div>
          </section>
        )}

        {name.antal_i_koranen != null && (
          <div style={{ margin: '0 18px' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: T.textMuted }}>Antal i Koranen</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: T.accent, fontVariantNumeric: 'tabular-nums' }}>{name.antal_i_koranen}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Q&A data ──────────────────────────────────────────────────
const QA_DATA = [
  {
    fraga: 'Har Allah endast 99 namn?',
    subtitle: 'Bevis från hadith: fler namn än 99',
    svar_kort: 'Nej.',
    forklaring: 'Beviset för det är hadithen där Profeten (salla Allahu \'alayhi wa sallam) sade:',
    citat: 'Jag ber dig vid varje namn som du har namngivit dig själv med eller som du har uppenbarat i din bok eller som du har lärt någon av din skapelse eller som du har hållit dolt för dig själv.',
    kalla: 'Ahmad (3712). Autentisk enligt Imam al-Albani i Silsilah as-Sahihah (199)',
    slutsats: 'Frasen "... eller som du har hållit dolt för dig själv" bevisar att Allah har namn som endast han känner till.',
  },
];

// ── Main screen ───────────────────────────────────────────────
export default function AsmaulHusnaScreen({ onBack, onMount }) {
  const { theme: T } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // 'qa' | 'lardomar' | 'hadith' | 'quiz'
  const [activeQA, setActiveQA] = useState(null); // selected Q&A item
  const [favs, setFavs] = useState(loadFavs);
  const [filterFavs, setFilterFavs] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => { onMount?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 120);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const handler = () => {
      if (activeQA) { setActiveQA(null); return; }
      if (activeSection) { setActiveSection(null); return; }
      if (selected) { setSelected(null); return; }
      onBack();
    };
    window.addEventListener('edgeSwipeBack', handler);
    return () => window.removeEventListener('edgeSwipeBack', handler);
  }, [selected, activeSection, activeQA, onBack]);

  const toggleFav = useCallback((nr) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(nr)) next.delete(nr); else next.add(nr);
      saveFavs(next);
      return next;
    });
  }, []);

  const searchIndex = useMemo(() => names.map(n => ({
    blob: [n.transliteration, n.swedish, n.arabic, n.forklaring || '', n.koranvers_svenska || '', String(n.nr)].join('\n').toLowerCase(),
  })), []);

  const filtered = useMemo(() => {
    if (!debouncedSearch && !filterFavs) return names;
    const q = debouncedSearch.toLowerCase();
    return names.filter((n, i) => {
      if (filterFavs && !favs.has(n.nr)) return false;
      if (!debouncedSearch) return true;
      return searchIndex[i].blob.includes(q) || n.arabic.includes(debouncedSearch);
    });
  }, [debouncedSearch, filterFavs, favs, searchIndex]);

  return (
    <div style={{ background: T.bg, minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Detail screen — always mounted, shown/hidden via CSS */}
      <div style={{ display: selected ? 'flex' : 'none', flexDirection: 'column', minHeight: '100%', position: 'absolute', inset: 0, zIndex: 10, background: T.bg }}>
        {selected && (
          <DetailScreen
            name={selected} onBack={() => setSelected(null)}
            isFav={favs.has(selected.nr)} onToggleFav={() => toggleFav(selected.nr)}
            T={T}
          />
        )}
      </div>

      {/* Q&A list screen */}
      {activeSection === 'qa' && !activeQA && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: T.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif" }}>
          <div style={{ padding: '18px 20px 8px' }}>
            <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 16, padding: 0, marginBottom: 16, WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Tillbaka
            </button>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.text, marginBottom: 20 }}>Frågor &amp; Svar</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
            {QA_DATA.map((qa, i) => (
              <button
                key={i}
                onClick={() => setActiveQA(qa)}
                style={{
                  width: '100%', textAlign: 'left', background: T.card,
                  border: `1px solid ${T.border}`, borderRadius: 18,
                  padding: '16px 18px', marginBottom: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 20, background: T.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 15, fontWeight: 700, color: '#fff',
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{qa.fraga}</div>
                  <div style={{ fontSize: 13, color: T.textMuted, marginTop: 3, lineHeight: 1.4 }}>{qa.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q&A detail screen */}
      {activeQA && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: T.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif" }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 48px' }}>
            <button onClick={() => setActiveQA(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 16, padding: 0, marginBottom: 20, WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7l6 6" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Tillbaka
            </button>

            <div style={{ fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>{activeQA.fraga}</div>
            <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 24 }}>{activeQA.subtitle}</div>

            {/* Fråga box */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.accent}`, borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.accent, marginBottom: 8 }}>Fråga</div>
              <div style={{ fontSize: 15, color: T.text, lineHeight: 1.6 }}>{activeQA.fraga}</div>
            </div>

            {/* Svar box */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.accent}`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.accent, marginBottom: 8 }}>Svar</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, lineHeight: 1.5 }}>{activeQA.svar_kort}</div>
            </div>

            {activeQA.forklaring && (
              <div style={{ fontSize: 15, color: T.text, lineHeight: 1.75, marginBottom: 20 }}>{activeQA.forklaring}</div>
            )}

            {activeQA.citat && (
              <div style={{ background: T.isDark ? 'rgba(45,139,120,0.12)' : 'rgba(36,100,93,0.07)', border: `1px solid ${T.accent}30`, borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
                <div style={{ fontSize: 15, color: T.text, lineHeight: 1.8, fontStyle: 'italic' }}>"{activeQA.citat}"</div>
              </div>
            )}

            {activeQA.kalla && (
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>[{activeQA.kalla}]</div>
            )}

            {activeQA.slutsats && (
              <div style={{ fontSize: 15, color: T.text, lineHeight: 1.75 }}>{activeQA.slutsats}</div>
            )}
          </div>
        </div>
      )}

      {/* List screen */}
      <div style={{ display: selected ? 'none' : 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 22, padding: '2px 8px 2px 0', WebkitTapHighlightColor: 'transparent', fontWeight: 300, lineHeight: 1 }}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1 }}>Allahs 99 namn</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>أسماء الله الحسنى</div>
          </div>
          {/* Grid/list toggle */}
          <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '7px 9px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center' }}>
            {viewMode === 'grid' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            )}
          </button>
        </div>

        {/* Search + fav filter */}
        <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: T.bgSecondary || T.bg, borderRadius: 12, padding: '8px 12px', border: `1px solid ${T.border}` }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök namn..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 16, color: T.text, flex: 1, fontFamily: "'Inter',system-ui,sans-serif" }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 17, padding: 0, lineHeight: 1 }}>×</button>}
          </div>
          <button onClick={() => setFilterFavs(f => !f)} style={{ background: filterFavs ? '#e53e3e' : T.card, border: `1px solid ${filterFavs ? '#e53e3e' : T.border}`, borderRadius: 12, padding: '8px 12px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: filterFavs ? '#fff' : T.textMuted, transition: 'all .18s' }}>
            <Heart filled={filterFavs} size={14} />
            {favs.size > 0 && <span>{favs.size}</span>}
          </button>
        </div>
      </div>

      {(search || filterFavs) && filtered.length < names.length && (
        <div style={{ padding: '6px 16px 0', fontSize: 12, color: T.textMuted }}>Visar {filtered.length} av {names.length} namn</div>
      )}

      {/* Action shortcuts — Lärdomar, Q&A, Hadith, Quiz */}
      {!search && !filterFavs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '14px 16px 4px' }}>
          {[
            {
              label: 'Lärdomar',
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              ),
            },
            {
              label: 'Q&A',
              onClick: () => setActiveSection('qa'),
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ),
            },
            {
              label: 'Hadith',
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              ),
            },
            {
              label: 'Quiz',
              icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <circle cx="12" cy="17" r="0.5" fill={T.accent}/>
                </svg>
              ),
            },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => item.onClick ? item.onClick() : {}} // placeholder
              style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 18, padding: '14px 8px 12px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                WebkitTapHighlightColor: 'transparent',
                fontFamily: "'Inter',system-ui,sans-serif",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 24,
                background: `${T.accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, animation: 'fadeUp .2s ease both' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: T.textMuted, fontSize: 15 }}>
            {filterFavs ? 'Inga favoriter ännu.' : 'Inga namn hittades.'}
          </div>
        ) : (
          <>
            <div style={{ display: viewMode === 'grid' ? 'grid' : 'none', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '14px 16px' }}>
              {filtered.map(n => (
                <GridCard key={n.nr} name={n} onPress={() => setSelected(n)}
                  isFav={favs.has(n.nr)} onToggleFav={() => toggleFav(n.nr)} T={T} />
              ))}
            </div>
            <div style={{ display: viewMode === 'list' ? 'block' : 'none', paddingTop: 4 }}>
              {filtered.map(n => (
                <ListRow key={n.nr} name={n} onPress={() => setSelected(n)}
                  isFav={favs.has(n.nr)} onToggleFav={() => toggleFav(n.nr)} T={T} />
              ))}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
