import React, { useState, useEffect, useRef, useCallback } from 'react';
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
      <audio ref={audioRef} src={`audio/${name.nr}.mp3`} onEnded={() => setPlaying(false)} />

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
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderBottom: `1px solid ${T.border}`,
      background: T.card,
      fontFamily: "'Inter',system-ui,sans-serif",
    }}>
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
      <audio ref={audioRef} src={`audio/${name.nr}.mp3`} onEnded={() => setPlaying(false)} />

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
          {/* Number */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: 22,
            background: T.accent, color: '#fff',
            fontSize: 16, fontWeight: 700, marginBottom: 16,
          }}>{name.nr}</div>

          {/* Arabic */}
          <div style={{
            fontSize: 58, lineHeight: 1.4, color: T.text,
            fontFamily: "'Scheherazade New','Traditional Arabic','Arial Unicode MS',serif",
            direction: 'rtl', marginBottom: 14,
          }}>{name.arabic}</div>

          {/* Transliteration */}
          <div style={{
            fontSize: 22, fontWeight: 700, color: T.text,
            letterSpacing: '-.2px', marginBottom: 4,
          }}>{name.transliteration}</div>

          {/* Swedish */}
          <div style={{ fontSize: 15, color: T.textMuted, fontWeight: 400, marginBottom: 24 }}>
            {name.swedish}
          </div>

          {/* Play */}
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

// ── Main screen ───────────────────────────────────────────────
export default function AsmaulHusnaScreen({ onBack }) {
  const { theme: T } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [favs, setFavs] = useState(loadFavs);
  const [filterFavs, setFilterFavs] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = () => { if (selected) setSelected(null); else onBack(); };
    window.addEventListener('edgeSwipeBack', handler);
    return () => window.removeEventListener('edgeSwipeBack', handler);
  }, [selected, onBack]);

  const toggleFav = useCallback((nr) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(nr)) next.delete(nr); else next.add(nr);
      saveFavs(next);
      return next;
    });
  }, []);

  const filtered = names.filter(n => {
    if (filterFavs && !favs.has(n.nr)) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.transliteration.toLowerCase().includes(q) ||
             n.swedish.toLowerCase().includes(q) ||
             n.arabic.includes(search) ||
             String(n.nr) === search.trim();
    }
    return true;
  });

  if (selected) return (
    <DetailScreen
      name={selected} onBack={() => setSelected(null)}
      isFav={favs.has(selected.nr)} onToggleFav={() => toggleFav(selected.nr)}
      T={T}
    />
  );

  return (
    <div style={{ background: T.bg, minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, fontSize: 22, padding: '2px 8px 2px 0', WebkitTapHighlightColor: 'transparent', fontWeight: 300, lineHeight: 1 }}>‹</button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Allah calligraphy logo */}
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: 48, height: 36, flexShrink: 0 }}>
              <path fill={T.text} d="M317.8,208c0-19.9-5.8-42.7-17.5-68.5-10.5-23.1-23.5-44.3-39.2-63.5-.4-.5-9-12.1-25.7-34.9-1.2-1.6-3.3-4-6.3-6.9-2.1-2.2-3.2-3.6-3.2-4.3V7.1c0-2.3.6-3.4,1.7-3.4s1.3.4,2.2,1.1l41.4,35.2c2.5,2.1,3.8,3.8,3.8,4.9s-.7,1.1-1.9,1.1-4.9-.8-9.1-2.5c-3.2-1.2-4.8-1.4-4.8-.7s.6,1.1,1.7,2.3c18.1,18.1,33.2,39.6,45.2,64.4,13.6,28.1,20.4,55.3,20.4,81.8s-6.1,47.7-18.3,64.9c-9.5,13.4-20.3,22.9-32.5,28.4-4.8,2.2-13,4.9-24.6,7.9-11.6,3-20.1,4.8-25.6,5.3-2.2.2-3.3,0-3.3-.6s1.1-1.5,3.2-3c10.6-5.9,27.8-16.3,51.8-31,27.1-17.6,40.7-36,40.7-55.2Z"/>
              <path fill={T.text} d="M263.1,180.1c-4-12.3-6.8-23.7-8.2-34.4-.5-4.1-.9-6.6-1.2-7.6-.6-2.2-1.6-4.4-3.2-6.6,1.1-3.7,2.9-8.8,5.2-15.4.8-1.9,1.5-2.9,2.1-2.9s1.5.9,3,2.9c6.3,8.8,11.6,16.6,15.8,23.5,1.8,2.9,2.6,4.9,2.6,6.1s-.4,1.3-1.2,1.3c-1.6,0-4.4-1.3-8.6-3.9-.4,0-.7.3-1,.8,1.5,5.2,3.7,12.3,6.9,21.3,7.2,20.4,10.8,35.2,10.8,44.5s-1.4,17.4-4.2,24.3c-4.6,11.8-12.6,17.7-24,17.7s-21.6-5.3-28.6-15.7c-4.2-6.3-8-15.7-11.2-28.3-1.4,12.7-5.4,23.5-12,32.7-8.1,11.1-18.5,16.6-31.1,16.6s-23.7-6.6-29.3-20c-3.1-7.5-4.6-16.2-4.6-26.3s1.6-25.8,4.7-37.3c.8-3.1,1.3-5.2,1.3-6.2s-.1-.8-.4-.8c-.6,0-1.9,1.5-3.8,4.6-3.1,4.9-6.4,14.7-9.8,29.6-4.4,19.2-7.3,30.7-8.7,34.7-1.8,5.5-4.4,9.9-7.7,13.3-2.7,2.8-5.1,4.2-7,4.2-8.9,0-15.8-5.7-20.6-17-4-9.4-5.9-20.7-5.9-34s1.4-19.4,4.3-30.3c.7-2.5,1.3-4.3,1.9-5.5.8-1.5,1.5-1.7,1.8-.6.3,1.3.2,3.5-.5,6.8-1.6,8.3-2.4,15.9-2.4,22.8,0,26.9,5.6,40.3,16.9,40.3s8.9-3.7,12.1-10.9c2-4.5,4.4-13.2,7.3-25.9,3.3-14.1,6.1-24.4,8.4-30.9,2.6-7.5,5.9-14.1,9.8-19.9,4.2-6.5,7.9-9.8,10.9-9.8s3.8,2.7,3.8,8.1-1.3,13.5-3.8,27.1c-2.5,13.7-3.8,22.8-3.8,27.5,0,10.2,2.1,18.1,6.4,23.8,4.2,5.8,10.2,8.6,17.7,8.6,13.7,0,24-4.3,30.8-12.9,5.4-6.8,8.1-15.1,8.1-25.1s-.8-18.8-2.4-27.7c-1.1-6.3-2.6-12.3-4.5-17.9-1.6-4.9-2.4-7.3-2.4-6.9,0-5.4,1.8-12.9,5.4-22.4.8-2.1,1.4-3.1,1.9-3.1s1.5,1.4,2.7,4c5.1,10.6,9.1,26.8,12.1,48.7,2.8,20.4,6.8,35,12,43.8,5.2,8.8,13.1,13.2,23.8,13.2s14.7-3.3,17.5-9.7c0-2.2-1.8-7-5.6-14.3-4.8-9.3-8.1-16.9-10.2-22.9Z"/>
              <path fill={T.text} d="M176.7,51.6c-.4,2-.8,3.1-1.5,3.3-.8.2-1.2-1-1.2-3.5s-.4-5-1.2-8.3c-2.5-10.9-11.1-20.3-25.8-28.2-.9-.5-1.2-1.4-.9-2.5l2-7c.2-.6.7-.7,1.5-.3,14.1,6.2,22.9,16.9,26.4,32.3,1.1,4.8,1.3,9.5.6,14.2Z"/>
              <path fill={T.text} d="M216.4,94.3c0,3.1-.7,6.3-2.1,9.7-1.8,4.3-4.1,6.5-7,6.5-4.5,0-7.7-3.1-9.6-9.3-2.2,8-6.1,12-11.8,12s-4-1.1-5.6-3.3c-1.9-2.6-2.7-5.9-2.7-10v-9.8c0-.8-.6-1.4-1.6-1.7-1.1-.3-1.6-1.1-1.6-2.5,0-2.2.9-4.3,2.7-6.3,1.7-1.8,2.9-2.7,3.8-2.7s1.7,2.2,1.7,6.4-.2,4.1-.6,5.6c-.4,1.5-.5,2.8-.5,3.9,0,2.3.4,4.6,1.4,6.7,1.1,2.5,2.5,3.7,4.2,3.7s4.2-1,6.1-3c1.9-1.9,2.8-4.2,2.8-6.9s-.4-4.1-1.3-7.7c-.9-3.7-1.3-5.9-1.3-6.8s.4-2.1,1.2-3.8c.8-1.7,1.4-2.6,1.8-2.6.7,0,1.7,2.4,2.8,7.3,1.1,4.8,1.8,8.4,1.8,10.7,0,6.7,2.5,10,7.7,10s3.6-1.1,4.2-3.3c-4.5-7.8-6.7-13.8-6.7-17.9s.6-4.5,1.8-6.3c.8-1.3,1.4-2,1.7-2,.4,0,.6.8.7,2.4.2,2.2.6,4,1.1,5.5,0,.1,1.1,2.9,3.2,8.2,1.3,3.2,1.9,5.6,1.9,7.3Z"/>
              <path fill={T.text} d="M143.3,73.3c22.1-8,45.6-16.6,70.4-25.7,1.2-.4,2-.6,2.2-.4.3.2.3.9-.2,2-1.5,3.5-2.6,5.6-3.5,6.3-20.8,7.5-45.2,17-73,28.6.8-3.3,2.2-6.9,4-10.8Z"/>
              <path fill={T.text} d="M136.5,257.8c0,2.9-1.2,6.2-3.6,10-2.5,3.9-5.7,7.2-9.5,9.9-1.5,1.1-2.5,1.7-2.8,1.7s0,0,0,0c0-.3.7-1.1,1.9-2.5,6.4-7,9.6-11.7,9.6-14s-1-3.3-3.1-3.3-2.2.3-3.1.9c-.7.4-1.1.7-1.3.8,0,0-.3-.2-.4-.2,0-.3.2-.8.4-1.8,1-4.8,3.4-7.2,7.2-7.2s4.8,2,4.8,5.9Z"/>
              <path fill={T.text} d="M246.1,85.6c0,2.9-1.2,6.3-3.6,10-2.5,3.9-5.7,7.2-9.5,9.9-1.5,1.1-2.5,1.7-2.8,1.7s0,0,0,0c0-.3.7-1.1,1.9-2.5,6.4-7,9.6-11.7,9.6-14s-1.1-3.4-3.1-3.4-2.2.3-3.1.9c-.7.4-1.1.7-1.3.7,0,0-.3-.2-.4-.2,0-.3.2-.8.4-1.8,1.1-4.8,3.4-7.2,7.2-7.2s4.8,2,4.8,5.9Z"/>
              <path fill={T.text} d="M167.2,178.8c3.2,0,6.1,1.9,8.6,5.7,2.5,3.8,4.4,8.8,5.4,14.9.1.6.2,1,.2,1.1.1.2.2.2.3,0,0,0,.2-.5.4-1.1.5-3.6,1.8-9.1,3.8-16.4,2.2-5.2,4.5-7.8,7.1-7.8s2.6.9,3.9,2.6c1.2,1.5,1.8,2.8,1.8,3.8s-.2,1.7-.6,2.9c-.5,1.6-1.1,2.4-1.8,2.4s-.9-.6-1.9-1.9c-1-1.2-2-1.8-3-1.8-2.3,0-4.4,5.4-6.4,16.2-.8,4.7-1.8,8-2.8,10-.8,1.3-1.4,2-1.9,2s-.7-.6-.7-1.8c0-1.9-1.1-5.6-3.3-11-2.2-5.4-3.7-8.2-4.6-8.2s-1.1.2-1.2.6c-.2.4-.7.6-1.5.6s-2.2-.7-3.8-2.1c-1.5-1.5-2.3-2.6-2.3-3.4s.7-1.7,1.9-3.9c1.3-2.2,2.2-3.3,2.5-3.3Z"/>
              <path fill={T.text} d="M223,262c0,2.9-1.2,6.2-3.6,10-2.5,3.9-5.7,7.2-9.5,9.9-1.5,1.1-2.5,1.7-2.8,1.7s0,0,0,0c0-.3.7-1.1,1.9-2.5,6.4-7,9.6-11.7,9.6-14s-1.1-3.3-3.1-3.3-2.1.3-3.1.9c-.7.4-1.1.7-1.3.7,0,0-.3-.2-.4-.2,0-.3.2-.8.4-1.8,1.1-4.8,3.4-7.2,7.2-7.2s4.7,2,4.7,5.9Z"/>
              <path fill={T.text} d="M164.8,265.7c2.2,0,4,1.3,5.8,3.8,1.7,2.5,2.9,5.8,3.6,9.9,0,.4.1.7.1.7,0,.1.1.1.2,0,0,0,.1-.3.3-.7.4-2.4,1.2-6.1,2.5-10.9,1.5-3.5,3-5.2,4.8-5.2s1.8.6,2.6,1.8c.7,1,1.1,1.8,1.1,2.5s-.1,1.1-.4,1.9c-.3,1.1-.7,1.6-1.2,1.6s-.6-.4-1.2-1.2c-.7-.8-1.3-1.2-2-1.2-1.5,0-2.9,3.6-4.2,10.8-.6,3.1-1.2,5.3-1.9,6.6-.5.9-.9,1.3-1.3,1.3s-.4-.4-.4-1.2c0-1.2-.7-3.7-2.2-7.3-1.5-3.7-2.5-5.5-3.1-5.5s-.7.1-.8.4c-.1.3-.5.4-1.1.4s-1.5-.5-2.6-1.5c-1-1-1.5-1.7-1.5-2.3s.4-1.1,1.3-2.6c.9-1.5,1.4-2.2,1.6-2.2Z"/>
              <path fill={T.text} d="M147.2,123c-1.3-3.8-3.8-6.7-7.5-8.8-.4,3.5-1.1,6.2-2,8.3.5.2,3.5,1,8.9,2.3.3,0,.6,0,.7,0,.3-.2.2-.8,0-1.8ZM134.8,121.7c.7-1.8.9-3.7.6-5.9-.3-2.3-1.2-3.6-2.7-3.7-.8,0-2,.5-3.6,1.8-1.6,1.3-2.5,2.4-2.5,3.1-.2,1.8,2.5,3.4,8.2,4.7ZM126.5,110.6c-.7-4-.2-6.8,1.6-8.3,1.4-1.1,2.9-1.6,4.7-1.5,1.7.2,3.5,1,5.5,2.3,7,4.9,11.5,10.4,13.3,16.5.1.4.2.9.1,1.6-.2,2-1.1,4.3-2.6,6.8-1.5,2.5-2.9,3.7-4.1,3.6-.4,0-3.9-.7-10.3-2.1-3.8,4.2-8.3,7.9-13.6,11-6.2,3.6-11.8,6.2-16.8,7.9-1.1.4-6.8,1.9-17.3,4.6-1.7.4-2.8.6-3.3.5-.2,0-.4,0-.4-.2,0-.3,1.1-1,3-2,7.9-3.6,15.7-7.2,23.6-10.8,9-4.1,16.1-8.1,21.1-12.1-5.7-1.9-8.4-4.9-8-8.9.4-3.3,1.5-6.3,3.5-9Z"/>
              <path fill={T.text} d="M109.4,35.6c3.6,0,6.8,2.1,9.6,6.3,2.9,4.2,4.8,9.7,6,16.5.1.7.2,1.1.2,1.2.1.2.2.2.3,0,0-.1.2-.5.5-1.2.6-4.1,1.9-10.2,4.2-18.2,2.4-5.8,5.1-8.7,7.9-8.7s2.9,1,4.4,2.9c1.3,1.7,1.9,3.1,1.9,4.2s-.2,1.9-.7,3.3c-.6,1.8-1.2,2.7-2,2.7s-1-.7-2.1-2.1c-1.1-1.4-2.2-2-3.4-2-2.5,0-4.9,6-7.1,18-.9,5.2-2,8.9-3.1,11.1-.8,1.5-1.5,2.2-2.1,2.2s-.7-.7-.7-2c0-2.1-1.2-6.2-3.7-12.2-2.4-6.1-4.1-9.1-5.1-9.1s-1.1.2-1.3.7c-.2.4-.8.7-1.7.7s-2.5-.8-4.3-2.4c-1.8-1.6-2.6-2.9-2.6-3.8s.7-1.9,2.2-4.4c1.5-2.5,2.4-3.6,2.8-3.6Z"/>
              <path fill={T.text} d="M205.7,10.5c0,3.3-1.4,6.9-4,11.1-2.8,4.3-6.3,8-10.6,11-1.7,1.2-2.7,1.9-3,1.9s0,0,0-.1c0-.2.7-1.1,2.2-2.7,7.1-7.8,10.7-13,10.7-15.6s-1.1-3.7-3.4-3.7-2.4.4-3.4,1c-.7.5-1.2.8-1.4.9-.1-.1-.3-.2-.5-.3,0-.2.2-.9.4-2,1.1-5.4,3.8-8,8-8s5.3,2.2,5.3,6.5Z"/>
              <path fill={T.text} d="M121.3,94.5c0,1.5-1.9,4.8-5.6,10.1-4.3,5.9-8.3,10.3-12.1,13-2.5,1.7-10.6,4.4-24.5,8.1-2.5.6-3.7.8-3.7.7.2-.3,1-1,2.5-2.2,1.8-1.4,6.7-4.2,14.8-8.4,7.7-4.1,12.3-6.7,13.6-7.9.2-.3.4-.5.4-.7,0-1.9-6.9-2.7-20.6-2.7s-2.7,0-7.9.3c-2.5.1-3.7,0-3.7-.5s.3-1.1.9-2.2l4.9-8.3c1.4-2.4,4-3.9,7.8-4.6,1.4-.2,4.5-.3,9.5-.3,15.8,0,23.8,1.8,23.8,5.5Z"/>
              <path fill={T.text} d="M187.9,135.6c0,2.9-1.2,6.2-3.6,10-2.5,3.9-5.7,7.2-9.5,9.9-1.5,1.1-2.5,1.7-2.8,1.7s0,0,0,0c0-.3.7-1.1,1.9-2.5,6.4-7,9.6-11.7,9.6-14s-1.1-3.3-3.1-3.3-2.2.3-3.1.9c-.7.4-1.1.7-1.3.7,0,0-.3-.2-.4-.2,0-.3.2-.8.4-1.8,1.1-4.8,3.4-7.2,7.2-7.2s4.8,2,4.8,5.9Z"/>
            </svg>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1 }}>Allahs 99 namn</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>أسماء الله الحسنى</div>
            </div>
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök namn..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 14, color: T.text, flex: 1, fontFamily: "'Inter',system-ui,sans-serif" }} />
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

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, animation: 'fadeUp .2s ease both' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: T.textMuted, fontSize: 15 }}>
            {filterFavs ? 'Inga favoriter ännu.' : 'Inga namn hittades.'}
          </div>
        ) : viewMode === 'grid' ? (
          // 2 columns
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '14px 16px' }}>
            {filtered.map(n => (
              <GridCard key={n.nr} name={n} onPress={() => setSelected(n)}
                isFav={favs.has(n.nr)} onToggleFav={() => toggleFav(n.nr)} T={T} />
            ))}
          </div>
        ) : (
          <div style={{ paddingTop: 4 }}>
            {filtered.map(n => (
              <ListRow key={n.nr} name={n} onPress={() => setSelected(n)}
                isFav={favs.has(n.nr)} onToggleFav={() => toggleFav(n.nr)} T={T} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
