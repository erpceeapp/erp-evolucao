CREATE POLICY "user_invites_select_authenticated" ON public.user_invites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_invites_insert_authenticated" ON public.user_invites
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "user_invites_delete_authenticated" ON public.user_invites
  FOR DELETE TO authenticated USING (true);
