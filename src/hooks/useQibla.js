import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchQiblaDirection } from '../services/prayerApi';

const ALIGN_TOL = 5;
const PERM_KEY  = 'compassPermission'; // cached in localStorage

function angleDelta(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function calcQiblaFallback(lat, lng) {
  const toR = d => d * Math.PI / 180;
  const toD = r => r * 180 / Math.PI;
  const ML = 21.4225, MG = 39.8262;
  const dLng = toR(MG - lng);
  const lat1 = toR(lat), lat2 = toR(ML);
  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toD(Math.atan2(x, y)) + 360) % 360;
}

function circularSmooth(prev, next, alpha) {
  let diff = next - prev;
  if (diff > 180)  diff -= 360;
  if (diff < -180) diff += 360;
  return (prev + alpha * diff + 360) % 360;
}

export function useQibla(location) {
  const [qiblaDir,     setQiblaDir]     = useState(null);
  const [heading,      setHeading]      = useState(0);
  const [needleAngle,  setNeedleAngle]  = useState(0);
  const [alignDelta,   setAlignDelta]   = useState(0);
  const [isAligned,    setIsAligned]    = useState(false);
  const [compassAvail, setCompassAvail] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  // null = not asked yet, 'granted' = cached yes, 'denied' = cached no
  const [permState,    setPermState]    = useState(() => localStorage.getItem(PERM_KEY) || null);

  const smoothedRef = useRef(0);
  const prevNeedle  = useRef(0);
  const wasAligned  = useRef(false);
  const qiblaDirRef = useRef(null);

  // Fetch Qibla direction
  const fetchDir = useCallback(async (lat, lng) => {
    setLoading(true); setError(null);
    try {
      const dir = await fetchQiblaDirection(lat, lng);
      setQiblaDir(dir);
      qiblaDirRef.current = dir;
    } catch (e) {
      setError(e.message);
      const fallback = calcQiblaFallback(lat, lng);
      setQiblaDir(fallback);
      qiblaDirRef.current = fallback;
    } finally {
      setLoading(false); }
  }, []);

  useEffect(() => {
    if (location) fetchDir(location.latitude, location.longitude);
  }, [location, fetchDir]);

  // Attach orientation listener
  const attachListener = useCallback(() => {
    const handleOrientation = (e) => {
      let h = 0;
      if (e.webkitCompassHeading != null) {
        h = e.webkitCompassHeading;
      } else if (e.alpha != null) {
        h = (360 - e.alpha) % 360;
      } else return;

      smoothedRef.current = circularSmooth(smoothedRef.current, h, 0.15);
      const smoothed = Math.round(smoothedRef.current * 10) / 10;
      setHeading(smoothed);

      if (qiblaDirRef.current !== null) {
        const target = (qiblaDirRef.current - smoothed + 360) % 360;
        let diff = target - prevNeedle.current;
        if (diff > 180)  diff -= 360;
        if (diff < -180) diff += 360;
        prevNeedle.current += diff;
        setNeedleAngle(prevNeedle.current);

        const delta = angleDelta(smoothed, qiblaDirRef.current);
        setAlignDelta(delta);
        const aligned = delta <= ALIGN_TOL;
        setIsAligned(aligned);
        if (aligned && !wasAligned.current && navigator.vibrate) navigator.vibrate([60, 30, 60]);
        wasAligned.current = aligned;
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation',         handleOrientation, true);
    setCompassAvail(true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation',         handleOrientation, true);
    };
  }, []);

  // On mount: start compass based on cached permission or device support
  useEffect(() => {
    if (!('DeviceOrientationEvent' in window)) {
      setCompassAvail(false);
      return;
    }

    // iOS needs explicit permission
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      const cached = localStorage.getItem(PERM_KEY);
      if (cached === 'granted') {
        // Already granted — attach directly (iOS remembers the grant in session)
        const cleanup = attachListener();
        return cleanup;
      }
      // Not yet asked — caller will show permission UI
      return;
    }

    // Android / non-iOS — no permission needed
    const cleanup = attachListener();
    return cleanup;
  }, [attachListener]);

  // Permission request called from UI
  const requestPermission = useCallback(async () => {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      localStorage.setItem(PERM_KEY, result);
      setPermState(result);
      if (result === 'granted') attachListener();
    } catch {
      localStorage.setItem(PERM_KEY, 'denied');
      setPermState('denied');
    }
  }, [attachListener]);

  // Static needle when no compass
  useEffect(() => {
    if (compassAvail || !qiblaDirRef.current) return;
    const target = (qiblaDirRef.current + 360) % 360;
    let diff = target - prevNeedle.current;
    if (diff > 180)  diff -= 360;
    if (diff < -180) diff += 360;
    prevNeedle.current += diff;
    setNeedleAngle(prevNeedle.current);
  }, [qiblaDir, compassAvail]);

  const needsPermission = typeof DeviceOrientationEvent?.requestPermission === 'function'
    && permState !== 'granted';

  return {
    qiblaDir, heading, needleAngle, alignDelta, isAligned,
    compassAvail, loading, error, needsPermission, requestPermission, permState
  };
}
