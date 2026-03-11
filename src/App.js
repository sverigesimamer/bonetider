import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import NewHomeScreen  from './components/NewHomeScreen';
import PrayerScreen   from './components/HomeScreen';
import MonthlyScreen  from './components/MonthlyScreen';
import QiblaScreen    from './components/QiblaScreen';
import EbooksScreen   from './components/EbooksScreen';
import SettingsScreen from './components/SettingsScreen';
import SvgIcon        from './components/SvgIcon';
import KabaIcon       from './icons/kaba.svg';
import PrayerTimesIcon from './icons/prayer-times.svg';

function svgColorFilter(isDark) {
  return isDark
    ? 'invert(48%) sepia(60%) saturate(400%) hue-rotate(120deg) brightness(90%)'
    : 'invert(30%) sepia(60%) saturate(500%) hue-rotate(130deg) brightness(80%)';
}

const TABS = [
  { id: 'home',     type: 'icon',   iconName: 'home',     label: 'Hem'           },
  { id: 'prayer',   type: 'custom', icon: 'prayer',       label: 'Bönetider'     },
  { id: 'qibla',    type: 'custom', icon: 'kaba',         label: 'Qibla'         },
  { id: 'ebooks',   type: 'icon',   iconName: 'book',     label: 'E-böcker'      },
  { id: 'settings', type: 'icon',   iconName: 'settings', label: 'Inställningar' },
];

function Shell() {
  const { theme: T } = useTheme();
  const [tab, setTab]             = useState('home');
  const [showMonthly, setShowMonthly] = useState(false);
  // Tab bar visibility — hidden while PDF reader is open
  const [tabBarVisible, setTabBarVisible] = useState(true);

  const renderScreen = () => {
    if (tab === 'prayer' && showMonthly) return <MonthlyScreen onBack={() => setShowMonthly(false)} />;
    switch (tab) {
      case 'home':     return <NewHomeScreen />;
      case 'prayer':   return <PrayerScreen onMonthlyPress={() => setShowMonthly(true)} />;
      case 'qibla':    return <QiblaScreen />;
      case 'ebooks':
        return (
          <EbooksScreen
            onReaderOpen={() => setTabBarVisible(false)}
            onReaderClose={() => setTabBarVisible(true)}
          />
        );
      case 'settings': return <SettingsScreen />;
      default:         return <NewHomeScreen />;
    }
  };

  return (
    <div style={{
      height: '100dvh', width: '100vw',
      background: T.bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', maxWidth: 500, margin: '0 auto',
      position: 'relative',
    }}>
      <div key={tab + (showMonthly ? '-monthly' : '')} style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: tabBarVisible ? 90 : 0,
      }}>
        {renderScreen()}
      </div>

      {/* ── FLOATING TAB BAR ── */}
      <div style={{
        position: 'absolute',
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 8px)`,
        left: '50%',
        transform: tabBarVisible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(calc(100% + 24px))',
        width: 'calc(100% - 32px)',
        maxWidth: 460,
        display: 'flex',
        background: T.isDark
          ? 'rgba(18,18,18,0.82)'
          : 'rgba(245,248,247,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 28,
        border: `1px solid ${T.border}`,
        boxShadow: T.isDark
          ? '0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.08)',
        padding: '6px 4px',
        zIndex: 200,
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setShowMonthly(false); }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: '7px 2px',
                background: active
                  ? T.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(36,100,93,0.08)'
                  : 'none',
                borderRadius: 22,
                border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', system-ui, sans-serif",
                WebkitTapHighlightColor: 'transparent',
                transition: 'background .2s',
              }}
            >
              {t.type === 'custom' ? (
                <img
                  src={t.icon === 'kaba' ? KabaIcon : PrayerTimesIcon}
                  alt={t.label}
                  style={{
                    width: 24, height: 24, objectFit: 'contain',
                    filter: active
                      ? svgColorFilter(T.isDark)
                      : T.isDark
                        ? 'invert(60%) opacity(0.45)'
                        : 'invert(0%) opacity(0.35)',
                    transition: 'filter .2s',
                  }}
                />
              ) : (
                <SvgIcon
                  name={t.iconName}
                  size={22}
                  color={active ? T.accent : T.textMuted}
                  style={{ opacity: active ? 1 : 0.45, transition: 'all .2s' }}
                />
              )}
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 500,
                letterSpacing: '.3px',
                color: active ? T.accent : T.textMuted,
                opacity: active ? 1 : 0.6,
                whiteSpace: 'nowrap',
                transition: 'all .2s',
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ThemeProvider>
  );
}
