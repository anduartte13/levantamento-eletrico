CREATE TABLE public.dados_usuario (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  chave text NOT NULL,
  valor text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chave)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dados_usuario TO authenticated;
GRANT ALL ON public.dados_usuario TO service_role;
ALTER TABLE public.dados_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.dados_usuario FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.dados_usuario FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.dados_usuario FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.dados_usuario FOR DELETE TO authenticated USING (auth.uid() = user_id);