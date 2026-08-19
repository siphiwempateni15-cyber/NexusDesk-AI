import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Ticket, AuditLog, Approval, NotificationRecord } from '../types';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setTickets((data || []) as Ticket[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tickets, loading, error, reload: load };
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs((data || []) as AuditLog[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { logs, loading, reload: load };
}

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('approvals')
      .select('*')
      .order('created_at', { ascending: false });
    setApprovals((data || []) as Approval[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { approvals, loading, reload: load };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notification_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data || []) as NotificationRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { notifications, loading, reload: load };
}
