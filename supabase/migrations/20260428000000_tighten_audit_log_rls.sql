-- Tighten audit_log RLS so org owners no longer get global read access.
-- The previous policy (audit_log_select_actor_or_owner) granted SELECT to
-- ANY user who owned ANY organization — there was no scoping by org_id, so
-- one org owner could read audit rows from completely unrelated tenants.
-- audit_log has no org_id column to scope by, so we restrict SELECT to the
-- actor only. If org-scoped audit access is needed later, expose it via a
-- SECURITY DEFINER RPC that filters server-side.

DROP POLICY IF EXISTS audit_log_select_actor_or_owner ON public.audit_log;

CREATE POLICY audit_log_select_actor ON public.audit_log
  FOR SELECT USING (actor_id = auth.uid());
