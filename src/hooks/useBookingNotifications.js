/**
 * useBookingNotifications.js
 *
 * Tre typer av notiser:
 *
 * 1. BESÖKAR-NOTISER — egna bokningar som fått svar (approved/rejected/cancelled/edited)
 *    Aktiveras bara om enheten har en bokning i systemet.
 *
 * 2. ADMIN-NOTISER (inloggad) — pending/edit_pending bokningar som behöver hanteras.
 *    Aktiveras om localStorage har admin-flagga.
 *
 * 3. ADMIN-DEVICE PENDING — enheten är registrerad i admin_devices (loggat in förut)
 *    men är inte inloggad just nu. Visar: "Nya bokningar behöver åtgärdas — gå till admin".
 *    Försvinner om användaren klickar "Ej admin" (sätter dismissed_at i admin_devices).
 *
 * Polling: 30s + Supabase Realtime. Körs bara för enheter som är relevanta.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const STORAGE_DEVICE       = 'islamnu_device_id';
const STORAGE_ADMIN        = 'islamnu_admin_mode';
const STORAGE_VISITOR_SEEN = 'islamnu_bookings_visitor_seen';
const STORAGE_ADMIN_SEEN   = 'islamnu_bookings_admin_seen';
const STORAGE_HAS_BOOKING  = 'islamnu_has_booking';
const POLL_INTERVAL_MS     = 30_000;

export function useBookingNotifications() {
  const [visitorUnread,     setVisitorUnread]     = useState(0);
  const [adminUnread,       setAdminUnread]       = useState(0);
  const [bellNotifs,        setBellNotifs]        = useState([]);
  const [adminPendingNotif, setAdminPendingNotif] = useState(null); // notis för admin-device ej inloggad
  const [active,            setActive]            = useState(false);

  const deviceId = localStorage.getItem(STORAGE_DEVICE);
  const isAdmin  = localStorage.getItem(STORAGE_ADMIN) === 'true';

  // ── Huvud-beräkning ──
  const calculate = useCallback(async () => {
    // 1. Besökar-notiser — bara egna rader
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
          type: 'booking',
          status: b.status,
          date: b.date,
          time_slot: b.time_slot,
          admin_comment: b.admin_comment,
        })));
      }
    }

    // 2. Admin inloggad — pending-räknare
    if (isAdmin) {
      const adminSeenAt = parseInt(localStorage.getItem(STORAGE_ADMIN_SEEN) || '0', 10);
      const { data } = await supabase
        .from('bookings')
        .select('id, created_at')
        .in('status', ['pending', 'edit_pending'])
        .gt('created_at', adminSeenAt);
      if (data) setAdminUnread(data.length);
    }

    // 3. Admin-device ej inloggad — kolla om enheten är registrerad och ej dismissed
    if (deviceId && !isAdmin) {
      const { data: adminDevice } = await supabase
        .from('admin_devices')
        .select('device_id, dismissed_at')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (adminDevice && !adminDevice.dismissed_at) {
        // Finns det pending bokningar?
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'edit_pending']);
        if ((count ?? 0) > 0) {
          setAdminPendingNotif({ count, deviceId });
        } else {
          setAdminPendingNotif(null);
        }
      } else {
        setAdminPendingNotif(null);
      }
    }
  }, [deviceId, isAdmin]);

  // ── Steg 1: avgör om polling ska aktiveras ──
  useEffect(() => {
    // Admin eller admin-device → alltid aktiv
    if (isAdmin) { setActive(true); return; }
    if (!deviceId) return;

    // Kolla om enheten är admin-device (oavsett om den har bokning)
    supabase
      .from('admin_devices')
      .select('device_id, dismissed_at')
      .eq('device_id', deviceId)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !data.dismissed_at) { setActive(true); return; }
        // Annars — kolla om enheten har en bokning
        const cached = localStorage.getItem(STORAGE_HAS_BOOKING);
        if (cached === 'true') { setActive(true); return; }
        if (cached === 'false') return;
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
      })
      .catch(() => {});
  }, [deviceId, isAdmin]);

  // ── Steg 2: starta Realtime + polling bara när active är true ──
  useEffect(() => {
    if (!active) return;

    calculate();

    const channel = supabase
      .channel('booking-notif-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, calculate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_devices' }, calculate)
      .subscribe();

    const poll = setInterval(calculate, POLL_INTERVAL_MS);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [active, calculate]);

  // ── Anropas när besökaren skapar sin första bokning ──
  const activateForDevice = useCallback(() => {
    localStorage.setItem(STORAGE_HAS_BOOKING, 'true');
    setActive(true);
  }, []);

  // ── Anropas när admin loggar in — registrerar enheten ──
  const registerAdminDevice = useCallback(async () => {
    if (!deviceId) return;
    await supabase
      .from('admin_devices')
      .upsert({ device_id: deviceId, created_at: Date.now(), dismissed_at: null },
               { onConflict: 'device_id' });
    setActive(true);
  }, [deviceId]);

  // ── Anropas när "Ej admin" klickas — sätter dismissed_at ──
  const dismissAdminDevice = useCallback(async () => {
    if (!deviceId) return;
    await supabase
      .from('admin_devices')
      .update({ dismissed_at: Date.now() })
      .eq('device_id', deviceId);
    setAdminPendingNotif(null);
  }, [deviceId]);

  const markVisitorSeen = useCallback(() => {
    localStorage.setItem(STORAGE_VISITOR_SEEN, Date.now().toString());
    setVisitorUnread(0);
    setBellNotifs([]);
  }, []);

  const markAdminSeen = useCallback(() => {
    localStorage.setItem(STORAGE_ADMIN_SEEN, Date.now().toString());
    setAdminUnread(0);
  }, []);

  const totalUnread = (deviceId ? visitorUnread : 0) + (isAdmin ? adminUnread : 0) + (adminPendingNotif ? 1 : 0);

  return {
    visitorUnread,
    adminUnread,
    adminPendingNotif,  // { count, deviceId } | null
    totalUnread,
    bellNotifs,
    activateForDevice,
    registerAdminDevice,
    dismissAdminDevice,
    markVisitorSeen,
    markAdminSeen,
  };
}
