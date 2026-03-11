import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import rawData from '../data/dhikr.json';

// ── Build clean category/dhikr tree (skip empty cats) ────────────────────────
const KATEGORIER = rawData.kategorier
  .filter(k => k.undersidor && k.undersidor.length > 0)
  .map(k => ({
    namn:       k.kategori,
    url:        k.kategori_url,
    undersidor: k.undersidor.map(us => ({
      titel:    us.titel,
      url:      us.url,
      dhikr:    us.dhikr_poster.map(d => ({
        titel:          d.titel         || '',
        arabisk_text:   d.arabisk_text  || '',
        translitteration: d.translitteration || '',
        svensk_text:    d.svensk_text   || '',
        kallhanvisning: d.kallhanvisning || '',
        mp3_url:        d.mp3_url       || '',
        _undersida:     us.titel,
        _kategori:      k.kategori,
      })),
    })),
  }));

// Flat list for search
const ALL_DHIKR = KATEGORIER.flatMap(k =>
  k.undersidor.flatMap(us => us.dhikr.map(d => ({ ...d })))
);

const TOTAL = ALL_DHIKR.length;

// ── Category icons ────────────────────────────────────────────────────────────
const CAT_ICON = {
  'Pilgrimsfärd':              '🕋',
  'Skulder':                   '🤲',
  'Hemmet':                    '🏠',
  'Resa':                      '✈️',
  'Nysning':                   '🤧',
  'Väder':                     '🌤️',
  'Begravning & dödsrelaterat':'🕊️',
  'Bönen':                     '🧎',
  'Sittningar':                '💬',
  'Moskén':                    '🕌',
  'Skydd':                     '🛡️',
  'Synder och ånger':          '💧',
  'Koranen':                   '📖',
  'Vid besök av den sjuke':    '🌿',
  'Övrigt':                    '☪️',
  'Hälsningsrelaterat':        '👋',
  'Äktenskap':                 '💑',
  'Djurrelaterat':             '🐾',
  'Glädje och ilska':          '❤️',
  'Mat och dryck':             '🍽️',
  'Svårigheter och motgångar': '⚡',
  'Kläder':                    '👘',
  'Morgon och kväll':          '🌅',
  'Toalett':                   '🚿',
  'Ramadan och fasta':         '🌙',
  'Sömn':                      '😴',
};
const icon = n => CAT_ICON[n] || '📿';

// ── Audio Player ──────────────────────────────────────────────────────────────
function AudioPlayer({ url, T }) {
  const ref = useRef(null);
  const [st, setSt] = useState({ playing: false, progress: 0, duration: 0, loading: false, err: false });

  useEffect(() => {
    setSt({ playing: false, progress: 0, duration: 0, loading: false, err: false });
    if (ref.current) { ref.current.pause(); ref.current.load(); }
  }, [url]);

  const fmt = s => (!s || isNaN(s)) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const toggle = () => {
    if (!ref.current) return;
    if (st.playing) { ref.current.pause(); setSt(s => ({ ...s, playing: false })); }
    else {
      setSt(s => ({ ...s, loading: true }));
      ref.current.play()
        .then(() => setSt(s => ({ ...s, playing: true, loading: false })))
        .catch(() => setSt(s => ({ ...s, err: true, loading: false })));
    }
  };

  const seek = e => {
    if (!ref.current || !st.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    ref.current.currentTime = ((e.clientX - r.left) / r.width) * st.duration;
  };

  if (!url) return null;
  return (
    <div style={{ marginTop: 14, background: T.isDark ? 'rgba(255,255,255,.07)' : 'rgba(36,100,93,.06)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <audio ref={ref} src={url} preload="none"
        onTimeUpdate={e => setSt(s => ({ ...s, progress: e.target.currentTime }))}
        onDurationChange={e => setSt(s => ({ ...s, duration: e.target.duration }))}
        onEnded={() => setSt(s => ({ ...s, playing: false, progress: 0 }))}
        onError={() => setSt(s => ({ ...s, err: true, loading: false, playing: false }))}
      />
      <button onClick={toggle} disabled={st.err} style={{
        width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: st.err ? '#c0392b' : T.accent, cursor: st.err ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}>
        {st.loading
          ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'dhSpin .7s linear infinite' }} />
          : st.err
          ? <span style={{ color: '#fff', fontSize: 12 }}>✕</span>
          : st.playing
          ? <svg width="11" height="13" viewBox="0 0 11 13" fill="#fff"><rect x="0" y="0" width="4" height="13" rx="1"/><rect x="7" y="0" width="4" height="13" rx="1"/></svg>
          : <svg width="11" height="13" viewBox="0 0 11 13" fill="#fff"><path d="M0 0 L11 6.5 L0 13Z"/></svg>
        }
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div onClick={seek} style={{ height: 4, borderRadius: 4, background: T.isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)', cursor: 'pointer', position: 'relative', marginBottom: 5 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 4, background: T.accent, width: st.duration ? `${(st.progress / st.duration) * 100}%` : '0%', transition: 'width .2s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, fontFamily: 'system-ui' }}>
          <span>{fmt(st.progress)}</span><span>{fmt(st.duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Dhikr Detail Card ─────────────────────────────────────────────────────────
function DhikrCard({ d, T }) {
  const tabs = [
    d.arabisk_text    && { id: 'ara', label: 'عربي' },
    d.svensk_text     && { id: 'swe', label: 'Svenska' },
    d.translitteration && { id: 'tra', label: 'Uttal' },
  ].filter(Boolean);
  const [tab, setTab] = useState(tabs[0]?.id || 'ara');
  useEffect(() => { if (tabs.length) setTab(tabs[0].id); }, [d.titel]);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
      {/* Title bar */}
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.4, fontFamily: 'system-ui' }}>{d.titel}</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontFamily: 'system-ui' }}>{d._undersida}</div>
      </div>

      {/* Tab pills */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '10px 14px 0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'system-ui',
              background: tab === t.id ? T.accent : (T.isDark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.07)'),
              color: tab === t.id ? '#fff' : T.textMuted,
              WebkitTapHighlightColor: 'transparent',
            }}>{t.label}</button>
          ))}
        </div>
      )}

      <div style={{ padding: '14px 18px 18px' }}>
        {/* Arabic */}
        {tab === 'ara' && d.arabisk_text && (
          <div style={{
            fontSize: 24, lineHeight: 2.2, color: T.text, textAlign: 'right', direction: 'rtl',
            fontFamily: '"Traditional Arabic","Scheherazade New","Amiri",serif',
            background: T.isDark ? 'rgba(255,255,255,.04)' : 'rgba(36,100,93,.05)',
            padding: '18px 16px', borderRadius: 12,
          }}>{d.arabisk_text}</div>
        )}
        {/* Swedish */}
        {tab === 'swe' && d.svensk_text && (
          <div style={{
            fontSize: 15, lineHeight: 1.85, color: T.text, fontStyle: 'italic',
            fontFamily: "'Georgia', serif",
            background: T.isDark ? 'rgba(255,255,255,.04)' : '#fdf8f4',
            padding: '16px', borderRadius: 12,
          }}>{d.svensk_text}</div>
        )}
        {/* Transliteration */}
        {tab === 'tra' && d.translitteration && (
          <div style={{
            fontSize: 14, lineHeight: 1.85, color: T.text,
            fontFamily: 'system-ui',
            background: T.isDark ? 'rgba(255,255,255,.04)' : '#f2f7f6',
            padding: '16px', borderRadius: 12,
          }}>{d.translitteration}</div>
        )}

        {/* Audio player */}
        {d.mp3_url && <AudioPlayer url={d.mp3_url} T={T} />}

        {/* Source */}
        {d.kallhanvisning && (
          <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted, fontFamily: 'system-ui', lineHeight: 1.6, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
            📚 {d.kallhanvisning}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category grid ─────────────────────────────────────────────────────────────
function CatGrid({ onSelect, T }) {
  return (
    <div style={{ padding: '14px 12px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {KATEGORIER.map(k => {
        const count = k.undersidor.reduce((s, us) => s + us.dhikr.length, 0);
        return (
          <button key={k.namn} onClick={() => onSelect(k)} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
            padding: '16px 14px 14px', cursor: 'pointer', textAlign: 'left',
            WebkitTapHighlightColor: 'transparent',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{icon(k.namn)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3, fontFamily: 'system-ui', marginTop: 4 }}>{k.namn}</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontFamily: 'system-ui' }}>{count} dhikr</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Category detail — list all undersidor + dhikr items ──────────────────────
function CatDetail({ kat, onSelectDhikr, T }) {
  return (
    <div style={{ paddingBottom: 32 }}>
      {kat.undersidor.map(us => (
        <div key={us.titel}>
          {/* Subsection header */}
          <div style={{
            padding: '14px 16px 6px',
            fontSize: 11, fontWeight: 700, color: T.accent,
            textTransform: 'uppercase', letterSpacing: 1.1, fontFamily: 'system-ui',
            borderBottom: `1px solid ${T.border}`,
          }}>
            {us.titel}
          </div>
          {us.dhikr.map((d, i) => (
            <button key={i} onClick={() => onSelectDhikr(d)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', background: 'none', border: 'none',
              borderBottom: `1px solid ${T.border}`,
              padding: '13px 16px', cursor: 'pointer', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.4, fontFamily: 'system-ui' }}>
                  {d.titel}
                </div>
                {d.arabisk_text && (
                  <div style={{
                    fontSize: 13, color: T.textMuted, marginTop: 4, direction: 'rtl', textAlign: 'right',
                    fontFamily: '"Traditional Arabic","Scheherazade New",serif', lineHeight: 1.6,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                  }}>{d.arabisk_text}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {d.mp3_url && <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent }} />}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Search results ────────────────────────────────────────────────────────────
function SearchView({ query, onSelectDhikr, onSelectCat, T }) {
  const q = query.toLowerCase();
  const cats   = useMemo(() => KATEGORIER.filter(k => k.namn.toLowerCase().includes(q)), [q]);
  const dhikrs = useMemo(() => ALL_DHIKR.filter(d =>
    d.titel.toLowerCase().includes(q) ||
    d.svensk_text.toLowerCase().includes(q) ||
    d.translitteration.toLowerCase().includes(q) ||
    d._undersida.toLowerCase().includes(q)
  ).slice(0, 50), [q]);

  if (!query.trim()) return null;
  return (
    <div style={{ paddingBottom: 32 }}>
      {cats.length > 0 && (
        <>
          <div style={{ padding: '12px 16px 4px', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'system-ui' }}>Kategorier</div>
          {cats.map(k => (
            <button key={k.namn} onClick={() => onSelectCat(k)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`,
              padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <span style={{ fontSize: 22 }}>{icon(k.namn)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: 'system-ui' }}>{k.namn}</div>
                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: 'system-ui' }}>
                  {k.undersidor.reduce((s, us) => s + us.dhikr.length, 0)} dhikr
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </>
      )}
      {dhikrs.length > 0 && (
        <>
          <div style={{ padding: '12px 16px 4px', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'system-ui' }}>
            Dhikr ({dhikrs.length}{dhikrs.length === 50 ? '+' : ''})
          </div>
          {dhikrs.map((d, i) => (
            <button key={i} onClick={() => onSelectDhikr(d)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`,
              padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.4, fontFamily: 'system-ui' }}>{d.titel}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontFamily: 'system-ui' }}>
                  {d._kategori} · {d._undersida}
                </div>
              </div>
              {d.mp3_url && <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, flexShrink: 0 }} />}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </>
      )}
      {cats.length === 0 && dhikrs.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: T.textMuted, fontFamily: 'system-ui', fontSize: 14 }}>
          Inga träffar för "{query}"
        </div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
// view: 'cats' | 'cat' | 'dhikr'
export default function DhikrScreen({ onBack }) {
  const { theme: T } = useTheme();
  const [view,         setView]         = useState('cats');
  const [selKat,       setSelKat]       = useState(null);
  const [selDhikr,     setSelDhikr]     = useState(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const bodyRef    = useRef(null);
  const searchRef  = useRef(null);

  const scrollTop = () => { if (bodyRef.current) bodyRef.current.scrollTop = 0; };

  const goToCat = useCallback(k => { setSelKat(k); setView('cat'); scrollTop(); setSearchActive(false); setSearchQuery(''); }, []);
  const goToDhikr = useCallback(d => { setSelDhikr(d); setView('dhikr'); scrollTop(); setSearchActive(false); setSearchQuery(''); }, []);
  const goBack = useCallback(() => {
    if (view === 'dhikr') { setView('cat'); setSelDhikr(null); scrollTop(); }
    else if (view === 'cat') { setView('cats'); setSelKat(null); scrollTop(); }
    else if (onBack) onBack();
  }, [view, onBack]);

  const openSearch = () => { setSearchActive(true); setTimeout(() => searchRef.current?.focus(), 80); };
  const closeSearch = () => { setSearchActive(false); setSearchQuery(''); };

  // Header content
  let title = "Dhikr & Du'a";
  let sub   = `${TOTAL} dhikr · ${KATEGORIER.length} kategorier`;
  if (view === 'cat' && selKat) {
    title = selKat.namn;
    sub   = `${selKat.undersidor.reduce((s, us) => s + us.dhikr.length, 0)} dhikr`;
  }
  if (view === 'dhikr' && selDhikr) {
    title = selDhikr._kategori;
    sub   = selDhikr._undersida;
  }

  const showBack = view !== 'cats' || !!onBack;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @keyframes dhSpin { to { transform: rotate(360deg); } }
        @keyframes dhFadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0, background: T.bg, borderBottom: `1px solid ${T.border}`,
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px 10px' }}>
          {showBack && (
            <button onClick={goBack} style={{
              background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
              padding: '4px 8px 4px 0', color: T.accent, fontSize: 22, lineHeight: 1,
              WebkitTapHighlightColor: 'transparent',
            }}>‹</button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.text, letterSpacing: '-.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{sub}</div>}
          </div>
          <button onClick={searchActive ? closeSearch : openSearch} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 7,
            color: searchActive ? T.accent : T.textMuted, WebkitTapHighlightColor: 'transparent', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>

        {searchActive && (
          <div style={{ padding: '0 14px 10px', animation: 'dhFadeUp .18s ease both' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.isDark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.06)',
              borderRadius: 12, padding: '9px 13px', border: `1px solid ${T.border}`,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Sök kategori, dhikr eller text…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: T.text, fontSize: 14, fontFamily: 'system-ui' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Search active */}
        {searchActive && (
          <SearchView query={searchQuery} onSelectDhikr={goToDhikr} onSelectCat={goToCat} T={T} />
        )}

        {/* Normal navigation (hidden when search is active and has query) */}
        {(!searchActive || !searchQuery.trim()) && (
          <>
            {view === 'cats'  && <CatGrid    onSelect={goToCat}           T={T} />}
            {view === 'cat'   && selKat   && <CatDetail kat={selKat}   onSelectDhikr={goToDhikr} T={T} />}
            {view === 'dhikr' && selDhikr && (
              <div style={{ padding: '16px 14px 40px' }}>
                <DhikrCard d={selDhikr} T={T} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
