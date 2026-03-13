/**
 * useBookingNotifications.js
 *
 * Smart aktivering — polling och Realtime körs BARA för:
 *   - Enheter som faktiskt har en bokning i systemet (kontrolleras via Supabase en gång,
 *     resultatet cachas i localStorage så nästa app-start är omedelbar)
 *   - Admin-användare (alltid aktiv)
 *
 * Vanliga besökare som aldrig bokat: noll anrop görs efter den initiala engångskontroll
 * som returnerar count=0 och cachen sätts till 'false'.
 *
 * När en bokning skapas anropas activateForDevice() från BookingScreen
 * vilket sätter cachen till 'true' direkt — ingen fördröjning.
 *
 * Datahämtning är också begränsad:
 *   - Besökare: .eq('device_id', deviceId) — bara egna rader
 *   - Admin: separat count-query på pending/edit_pending
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const STORAGE_DEVICE       = 'islamnu_device_id';
const STORAGE_ADMIN        = 'islamnu_admin_mode';
const STORAGE_VISITOR_SEEN = 'islamnu_bookings_visitor_seen';
const STORAGE_ADMIN_SEEN   = 'islamnu_bookings_admin_seen';
const STORAGE_HAS_BOOKING  = 'islamnu_has_booking'; // 'true' | 'false' | unset
const POLL_INTERVAL_MS     = 30_000;

export function useBookingNotifications() {
  const [visitorUnread, setVisitorUnread] = useState(0);
  const [adminUnread,   setAdminUnread]   = useState(0);
  const [bellNotifs,    setBellNotifs]    = useState([]);
  const [active,        setActive]        = useState(false);

  const deviceId = localStorage.getItem(STORAGE_DEVICE);
  const isAdmin  = localStorage.getItem(STORAGE_ADMIN) === 'true';

  // Huvud-beräkning — hämtar bara relevanta rader
  const calculate = useCallback(async () => {
    if (deviceId) {
      const seenAt = parseInt(localStorage.getItem(STORAGE_VISITOR_SEEN) || '0', 10);
      const { data } = await supabase
        .from('bookings')
        .select('id, status, resolved_at, date, time_slot, admin_comment')
        .eq('device_id', deviceId)
        .in('status', ['approved', 'rejected', 'cancelled', 'edited'])
        .gt('resolved_at', seenAt);
      if (data) {
        setVisitorUnread(data.length);
        setBellNotifs(data.map(b => ({
          id: b.id,
          status: b.status,
          date: b.date,
          time_slot: b.time_slot,
          admin_comment: b.admin_comment,
        })));
      }
    }

    if (isAdmin) {
      const adminSeenAt = parseInt(localStorage.getItem(STORAGE_ADMIN_SEEN) || '0', 10);
      const { data } = await supabase
        .from('bookings')
        .select('id, created_at')
        .in('status', ['pending', 'edit_pending'])
        .gt('created_at', adminSeenAt);
      if (data) setAdminUnread(data.length);
    }
  }, [deviceId, isAdmin]);

  // Steg 1: avgör om polling ska aktiveras
  useEffect(() => {
    if (isAdmin) { setActive(true); return; }
    if (!deviceId) return;

    const cached = localStorage.getItem(STORAGE_HAS_BOOKING);
    if (cached === 'true')  { setActive(true);  return; }
    if (cached === 'false') { return; } // ingen bokning — gör inget mer

    // Ingen cache ännu — en engångskontroll
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', deviceId)
      .then(({ count }) => {
        const has = (count ?? 0) > 0;
        localStorage.setItem(STORAGE_HAS_BOOKING, has ? 'true' : 'false');
        if (has) setActive(true);
      })
      .catch(() => {});
  }, [deviceId, isAdmin]);

  // Steg 2: starta Realtime + polling bara när active är true
  useEffect(() => {
    if (!active) return;

    calculate();

    const channel = supabase
      .channel('booking-notif-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, calculate)
      .subscribe();

    const poll = setInterval(calculate, POLL_INTERVAL_MS);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [active, calculate]);

  // Anropas från BookingScreen direkt när besökaren skapar sin första bokning
  const activateForDevice = useCallback(() => {
    localStorage.setItem(STORAGE_HAS_BOOKING, 'true');
    setActive(true);
  }, []);

  const markVisitorSeen = useCallback(() => {
    localStorage.setItem(STORAGE_VISITOR_SEEN, Date.now().toString());
    setVisitorUnread(0);
    setBellNotifs([]);
  }, []);

  const markAdminSeen = useCallback(() => {
    localStorage.setItem(STORAGE_ADMIN_SEEN, Date.now().toString());
    setAdminUnread(0);
  }, []);

  const totalUnread = (deviceId ? visitorUnread : 0) + (isAdmin ? adminUnread : 0);

  return {
    visitorUnread,
    adminUnread,
    totalUnread,
    bellNotifs,
    activateForDevice,
    markVisitorSeen,
    markAdminSeen,
  };
}
