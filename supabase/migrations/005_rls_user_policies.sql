-- ============================================
-- Migration 005: User-level RLS Policies
-- ============================================
-- Voegt ontbrekende user-level SELECT policies toe.
-- De service_role policies bestaan al uit eerdere migraties.
-- Deze migratie voegt authenticated-user policies toe zodat
-- Supabase client-side queries ook werken met RLS.

-- ─── 1. Workspaces ───
-- Gebruikers kunnen workspaces lezen in hun eigen tenant
CREATE POLICY "Users can read workspaces in their tenant"
  ON workspaces FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- ─── 2. Workspace Access ───
-- Gebruikers kunnen hun eigen workspace-toegang lezen
CREATE POLICY "Users can read their own workspace access"
  ON workspace_access FOR SELECT
  USING (user_id IN (SELECT public.get_my_tenant_user_ids()));

-- ─── 3. Meta Workspaces ───
-- Admin-gebruikers in een tenant kunnen meta data lezen
CREATE POLICY "Users can read meta workspaces in their tenant"
  ON meta_workspaces FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- ─── 4. Meta Reports ───
CREATE POLICY "Users can read meta reports in their tenant"
  ON meta_reports FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- ─── 5. Meta Datasets ───
CREATE POLICY "Users can read meta datasets in their tenant"
  ON meta_datasets FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- ─── 6. Meta Refresh History ───
CREATE POLICY "Users can read meta refresh history in their tenant"
  ON meta_refresh_history FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));

-- ─── 7. Meta Sync Log ───
CREATE POLICY "Users can read meta sync log in their tenant"
  ON meta_sync_log FOR SELECT
  USING (tenant_id IN (SELECT public.get_my_tenant_ids()));
