import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useBanner } from '../hooks/useBanner';
import { useBookingNotifications } from '../hooks/useBookingNotifications';
import SvgIcon from './SvgIcon';
import IslamNuLogoTeal from '../icons/islamnu-logga-light.svg';

/* ── Countdown to scheduled stream ─────────────────────────── */
function useCountdownTo(isoDate) {
  const [label, setLabel] = React.useState('');
  React.useEffect(() => {
    if (!isoDate) return;
    const tick = () => {
      const diff = new Date(isoDate) - Date.now();
      if (diff <= 0) { setLabel('Startar snart'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isoDate]);
  return label;
}

/* ── YouTube live/upcoming card ─────────────────────────────── */
function YoutubeCard({ stream, T }) {
  const countdown = useCountdownTo(
    stream.status === 'upcoming' ? stream.scheduledStart : null
  );

  const isLive = stream.status === 'live';

  const scheduledLabel = React.useMemo(() => {
    if (!stream.scheduledStart) return null;
    return new Date(stream.scheduledStart).toLocaleString('sv-SE', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  }, [stream.scheduledStart]);

  return (
    <a
      href={`https://www.youtube.com/watch?v=${stream.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${isLive ? '#FF0000' : T.border}`,
        boxShadow: isLive
          ? '0 0 0 1px rgba(255,0,0,0.3), 0 4px 24px rgba(255,0,0,0.15)'
          : `0 4px 20px rgba(0,0,0,${T.isDark ? '.3' : '.08'})`,
        background: T.card,
        animation: 'cardIn .35s ease both',
      }}>
        {/* Thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}>
          {stream.thumbnail && (
            <img
              src={stream.thumbnail}
              alt={stream.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {/* Live badge */}
          {isLive && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: '#FF0000', color: '#fff',
              borderRadius: 6, padding: '3px 9px',
              fontSize: 11, fontWeight: 800, letterSpacing: 1,
              fontFamily: 'system-ui',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 2px 8px rgba(0,0,0,.4)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#fff',
                animation: 'livePulse 1.2s ease-in-out infinite',
                flexShrink: 0,
              }}/>
              LIVE
            </div>
          )}
          {/* Upcoming badge */}
          {!isLive && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(0,0,0,.7)', color: '#fff',
              borderRadius: 6, padding: '3px 9px',
              fontSize: 11, fontWeight: 700,
              fontFamily: 'system-ui', backdropFilter: 'blur(4px)',
            }}>
              📅 Schemalagd
            </div>
          )}
          {/* Play overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.18)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(255,255,255,.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,.3)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#111">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: T.text,
            lineHeight: 1.35, fontFamily: "'Georgia', serif",
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{stream.title}</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={IslamNuLogoTeal} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              <span style={{ fontSize: 12, color: T.textMuted, fontFamily: 'system-ui' }}>Islam.nu</span>
            </div>
            {isLive ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FF0000', fontFamily: 'system-ui' }}>
                Titta nu →
              </span>
            ) : (
              <div style={{ textAlign: 'right' }}>
                {scheduledLabel && (
                  <div style={{ fontSize: 11, color: T.textMuted, fontFamily: 'system-ui' }}>{scheduledLabel}</div>
                )}
                {countdown && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: 'system-ui' }}>
                    om {countdown}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

/* ── Booking notification label helpers ── */
function bookingNotifText(n) {
  const statusLabel = {
    approved:  'Din bokning har godkänts',
    rejected:  'Din bokning avböjdes',
    cancelled: 'Din bokning ställdes in',
    edited:    'Din bokning ändrades av admin',
  };
  const base = statusLabel[n.status] || 'Uppdatering på din bokning';
  return `${base} — ${n.date ? n.date.split('-').reverse().join('/') : ''} · ${n.time_slot || ''}`;
}
function bookingNotifColor(status) {
  return status==='approved'?'#22c55e':status==='rejected'?'#ef4444':status==='edited'?'#3b82f6':'#64748b';
}

/* ── Main screen ── */
export default function NewHomeScreen({ stream, onGoToAdminLogin }) {
  const { theme: T } = useTheme();
  const { allBanners, banners, unreadCount, read, dismiss, markRead, markAllRead } = useBanner();
  const { bellNotifs, visitorUnread, adminPendingNotif, adminUnread, markVisitorSeen, dismissAdminDevice } = useBookingNotifications();
  const [showBellPanel, setShowBellPanel] = React.useState(false);
  const [adminNotifDismissedThisSession, setAdminNotifDismissedThisSession] = React.useState(false);

  const isAdmin = localStorage.getItem('islamnu_admin_mode') === 'true';
  const showAdminPending = adminPendingNotif && !adminNotifDismissedThisSession && !isAdmin;
  const totalUnread = unreadCount + visitorUnread + (showAdminPending ? 1 : 0) + (isAdmin ? adminUnread : 0);

  const handleBellOpen = (e) => {
    e.stopPropagation();
    setShowBellPanel(v => !v);
    allBanners.forEach(b => markRead(b.id));
    if (visitorUnread > 0) markVisitorSeen();
  };

  const handleAdminNotifClick = () => {
    setShowBellPanel(false);
    onGoToAdminLogin?.();
  };

  const allItems = [
    ...(showAdminPending ? [{ type: 'admin_pending', count: adminPendingNotif.count }] : []),
    ...bellNotifs.map(n => ({ type: 'booking', ...n })),
    ...allBanners.map(b => ({ type: 'banner', ...b })),
  ];

  return (
    <div
      style={{ background: T.bg, minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}
      onMouseDown={() => setShowBellPanel(false)}
    >
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bannerIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes livePulse{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <img src={IslamNuLogoTeal} alt="islam.nu"
          style={{ width: 72, height: 72, pointerEvents: 'none', userSelect: 'none' }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-.3px' }}>Hem</div>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button onClick={handleBellOpen}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, WebkitTapHighlightColor: 'transparent' }}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <SvgIcon name="bell" size={24} color={totalUnread > 0 ? T.accent : T.textMuted}
                style={{ opacity: totalUnread > 0 ? 1 : 0.5, transition: 'color .2s, opacity .2s' }} />
              {totalUnread > 0 && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 17, height: 17, borderRadius: 9,
                  background: '#FF3B30', border: `2px solid ${T.bg}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', boxSizing: 'border-box',
                  animation: 'fadeUp .2s ease',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                </div>
              )}
            </div>
          </button>

          {showBellPanel && (
            <div onMouseDown={e => e.stopPropagation()} style={{
              position: 'absolute', top: 44, right: 0,
              width: 'min(320px, calc(100vw - 32px))',
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, zIndex: 500,
              boxShadow: `0 8px 32px rgba(0,0,0,${T.isDark ? '0.5' : '0.12'})`,
              overflow: 'hidden', animation: 'fadeUp .2s ease both',
              maxHeight: '70vh', overflowY: 'auto',
            }}>
              {/* Panel header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px 10px', borderBottom: `1px solid ${T.border}`,
                position: 'sticky', top: 0, background: T.card, zIndex: 1,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Meddelanden</span>
                {allItems.length > 0 && (
                  <button onClick={() => { markAllRead(); markVisitorSeen(); setShowBellPanel(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: T.accent, padding: '2px 0' }}>
                    Markera alla lästa
                  </button>
                )}
              </div>

              {allItems.length === 0
                ? <div style={{ padding: '20px 14px', fontSize: 13, color: T.textMuted, textAlign: 'center' }}>Inga meddelanden</div>
                : allItems.map((item) => {

                  /* ── Admin pending notis ── */
                  if (item.type === 'admin_pending') return (
                    <div key="admin-pending" style={{ borderBottom: `1px solid ${T.border}`, background: T.isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.05)' }}>
                      <div onClick={handleAdminNotifClick} style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: '#f59e0b22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>Adminpanel</div>
                          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.45 }}>
                            {item.count} bokning{item.count !== 1 ? 'ar' : ''} behöver åtgärdas — tryck för att logga in
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setAdminNotifDismissedThisSession(true); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>×</button>
                      </div>
                      <div style={{ padding: '0 14px 10px', paddingLeft: 52 }}>
                        <button onClick={async e => { e.stopPropagation(); setAdminNotifDismissedThisSession(true); await dismissAdminDevice(); }}
                          style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: T.textMuted, cursor: 'pointer', fontFamily: 'system-ui', WebkitTapHighlightColor: 'transparent' }}>
                          Jag är inte admin — visa inte igen
                        </button>
                      </div>
                    </div>
                  );

                  /* ── Bokningsnotis ── */
                  if (item.type === 'booking') {
                    const color = bookingNotifColor(item.status);
                    return (
                      <div key={`booking-${item.id}`} style={{ padding: '11px 14px', borderBottom: `1px solid ${T.border}`, background: T.isDark ? `${color}09` : `${color}07`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {item.status==='approved'?<polyline points="20 6 9 17 4 12"/>:item.status==='rejected'||item.status==='cancelled'?<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>:<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>}
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>Bokningsuppdatering</div>
                          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.45 }}>{bookingNotifText(item)}</div>
                          {item.admin_comment && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3, fontStyle: 'italic' }}>"{item.admin_comment}"</div>}
                        </div>
                      </div>
                    );
                  }

                  /* ── Banner ── */
                  const isRead = read.includes(item.id);
                  return (
                    <div key={`banner-${item.id}`} style={{ padding: '11px 14px', borderBottom: `1px solid ${T.border}`, background: isRead ? 'transparent' : T.isDark ? 'rgba(45,139,120,0.06)' : 'rgba(36,100,93,0.05)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 4, flexShrink: 0, marginTop: 5, background: isRead ? 'transparent' : T.accent }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>{item.message}</div>
                        {item.linkText && item.linkUrl && (
                          <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 5, fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'underline', textUnderlineOffset: 2 }}>{item.linkText} →</a>
                        )}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Admin-kort: synligt när inloggad som admin och det finns pending */}
        {isAdmin && adminUnread > 0 && (
          <div onClick={() => onGoToAdminLogin?.()} style={{
            background: T.card, border: `2px solid #f59e0b66`,
            borderLeft: `4px solid #f59e0b`,
            borderRadius: 14, padding: '13px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', animation: 'bannerIn .3s ease both',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 2, fontFamily: 'system-ui' }}>ADMINPANEL</div>
              <div style={{ fontSize: 13, color: T.text, fontFamily: 'system-ui' }}>
                {adminUnread} bokning{adminUnread !== 1 ? 'ar' : ''} väntar på åtgärd
              </div>
            </div>
            <div style={{ background: '#f59e0b', color: '#fff', borderRadius: 8, minWidth: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, padding: '0 6px', fontFamily: 'system-ui' }}>
              {adminUnread > 9 ? '9+' : adminUnread}
            </div>
          </div>
        )}

        {/* Inline banner feed */}
        {banners.map((b, i) => (
          <div key={b.id} style={{
            background: T.card, border: `1px solid ${T.accent}44`, borderLeft: `4px solid ${T.accent}`,
            borderRadius: 14, padding: '13px 14px', display: 'flex', alignItems: 'flex-start', gap: 12,
            boxShadow: `0 2px 16px ${T.accentGlow}`, animation: `bannerIn .3s ease both`, animationDelay: `${i * 60}ms`,
          }}>
            <img src={IslamNuLogoTeal} alt="" style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2, objectFit: 'contain' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: T.textSecondary, fontFamily: 'system-ui' }}>{b.message}</div>
              {b.linkText && b.linkUrl && (
                <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'system-ui' }}>{b.linkText} →</a>
              )}
            </div>
            <button onClick={e => { e.stopPropagation(); dismiss(b.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 20, lineHeight: 1, padding: '0 2px', flexShrink: 0, marginTop: -2, WebkitTapHighlightColor: 'transparent' }}>×</button>
          </div>
        ))}

        {/* YouTube live / upcoming */}
        {stream && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, fontFamily: 'system-ui' }}>
              {stream.status === 'live' ? '🔴 Sänder just nu' : '📺 Kommande sändning'}
            </div>
            <YoutubeCard stream={stream} T={T} />
          </div>
        )}
      </div>
    </div>
  );
}
