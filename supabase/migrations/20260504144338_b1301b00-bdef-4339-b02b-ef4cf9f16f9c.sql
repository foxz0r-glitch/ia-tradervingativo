CREATE POLICY "kirvano_events: leitura admin" ON public.kirvano_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "kirvano_product_map: escrita autenticado" ON public.kirvano_product_map
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');