-- =========================================================================
-- RESTAURA O GUARD DE ADMIN em public.admin_crm_report()
--
-- CAUSA-RAIZ: a conversao plpgsql -> LANGUAGE sql feita em
-- 20260509120914_116c46fd-287e-4b1d-b489-69820667a391.sql PERDEU a checagem
-- de autorizacao. A versao anterior (20260430023100_b91861f7-67f2-49cf-912f-16678fee3a63.sql:10)
-- tinha:
--     IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
-- LANGUAGE sql nao comporta guard imperativo, entao a checagem sumiu -- mas o
-- GRANT EXECUTE ... TO authenticated (20260509120914:86) permaneceu, e nenhum
-- REVOKE foi emitido. Resultado: por ~2 meses a funcao ficou SECURITY DEFINER
-- (bypassa RLS) + executavel + SEM checagem, devolvendo email, whatsapp, genero,
-- birth_date, total_deposited, current_balance e casatrade_user_id de TODOS os
-- usuarios, sem filtro por auth.uid(). Isso contradiz a RLS de public.profiles
-- (20260430032339:13-22: "usuarios veem proprio perfil" / "admins veem tudo").
-- A gate de /admin no cliente (src/pages/Admin.tsx:95-108, via useIsAdmin ->
-- has_role) protege a UI, NAO os dados: a RPC e chamavel direto via PostgREST.
--
-- Isto e REGRESSAO, nao decisao, e a evidencia e dupla:
--  (1) a PROPRIA admin_crm_report tinha o guard nas suas DUAS versoes anteriores
--      -- v1 (20260429230414:39, guard :58) e v2 (20260430023100:3, guard :10);
--      so a v3 (20260509120914:7), a da conversao pra LANGUAGE sql, o perdeu;
--  (2) TODAS as funcoes admin_* irmas mantem o guard ate hoje:
--      admin_list_users (20260429205354:67, guard :79),
--      admin_user_stats (20260429205354:91, guard :101),
--      admin_upsert_casatrade (20260429230414:86, guard :93) e
--      admin_ops_cross_check (20260620000000:12, guard :51, no padrao WHERE).
--
-- FORMA DO FIX: restaura plpgsql + IF/RAISE, revertendo a causa-raiz e
-- padronizando com as irmas (erro explicito 'forbidden' em vez de lista vazia
-- silenciosa). Existe um 2o padrao no repo -- WHERE public.has_role(...) dentro
-- de LANGUAGE sql (20260620000000:51) -- que NAO foi o escolhido.
--
-- ⛔ SEM DROP: DROP FUNCTION apaga a ACL e o CREATE seguinte concede EXECUTE a
-- PUBLIC por default -- deixaria a funcao aberta ate pro anon, PIOR que hoje.
-- (A vigente FAZ o DROP e nao emite REVOKE: e provavel que o PUBLIC tenha
-- EXECUTE hoje. Ver PRE-CHECK 2 no RECON-guard-crm.md.) Usamos CREATE OR
-- REPLACE, que PRESERVA a ACL, e reafirmamos as permissoes no fim.
--
-- #variable_conflict use_column: RETURNS TABLE cria OUT params com os nomes das
-- 24 colunas (created_at, whatsapp, ws_ftd_date, aulas_assistidas...). O default
-- do plpgsql e "error" -> qualquer referencia nao-qualificada que case com um
-- desses nomes levantaria 'column reference is ambiguous' -- e o CREATE so checa
-- SINTAXE, entao o erro so apareceria na PRIMEIRA CHAMADA, com a migration ja
-- "aplicada com sucesso". A varredura deste SELECT (incluindo os 2 LATERALs)
-- nao achou nenhuma referencia nao-qualificada: tudo usa u./xp./ua./cd./pr./ws./lp./bh./lpp.
-- (os ws_*/aulas_assistidas sao ALIASES de saida, nao referencias). Mesmo assim
-- o pragma fica como defesa: a versao anterior em plpgsql tinha um SELECT MENOR
-- (17 colunas, SEM os LATERALs, que nasceram no 20260509120914), portanto ela
-- NAO calibra o risco deste SELECT -- nao da pra alegar "funcionava antes".
-- O corpo nunca LE os OUT params (so produz linhas via RETURN QUERY), entao
-- "coluna vence" e sempre a resolucao correta aqui.
--
-- O SELECT abaixo e BYTE-IDENTICO ao de 20260509120914:38-83 (nada foi
-- reformatado, nenhum JOIN/LATERAL alterado, pr.whatsapp intocado -- o B1 e
-- outra decisao e NAO entra aqui). O RETURNS TABLE tambem e byte-identico:
-- CREATE OR REPLACE nao permite mudar OUT params, e src/pages/Admin.tsx +
-- src/integrations/supabase/types.ts dependem da assinatura.
--
-- ⚠️ VALIDACAO OBRIGATORIA POS-APLICACAO (nao ha check automatizado de SQL neste
-- repo -- o vitest so tem teste de exemplo). A troca LANGUAGE sql -> plpgsql move
-- do CREATE-time pro CALL-time a validacao do corpo INTEIRO, nao so a resolucao de
-- ambiguidade: com LANGUAGE sql o check_function_bodies faz parse + type-check do
-- SELECT contra o RETURNS TABLE na hora do CREATE; com plpgsql o validador so
-- compila a estrutura e adia coluna inexistente / tipo divergente / ambiguidade
-- pra 1a chamada. Ou seja: esta migration pode "aplicar com sucesso" e o CRM
-- quebrar na 1a chamada. DEPOIS de aplicar, ABRIR /admin como admin e confirmar
-- que o CRM lista os usuarios. (Risco baixo: as 24 expressoes ja passam hoje no
-- type-check do LANGUAGE sql contra este MESMO RETURNS TABLE.)
-- ROLLBACK: reaplicar 20260509120914:7-84 (o CREATE OR REPLACE, SEM o DROP da L5)
-- -- volta ao estado atual, inseguro porem funcional.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.admin_crm_report()
RETURNS TABLE (
  user_id              uuid,
  email                text,
  display_name         text,
  created_at           timestamptz,
  last_sign_in_at      timestamptz,
  total_xp             integer,
  current_rank         text,
  streak_days          integer,
  plan                 text,
  access_expires_at    timestamptz,
  casatrade_user_id    text,
  total_deposited      numeric,
  deposit_count        integer,
  ftd_date             timestamptz,
  ftd_amount           numeric,
  current_balance      numeric,
  ws_total_deposited   numeric,
  ws_deposit_count     bigint,
  ws_ftd_date          timestamptz,
  ws_ftd_amount        numeric,
  aulas_assistidas     bigint,
  whatsapp             text,
  genero               text,
  birth_date           date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
#variable_conflict use_column
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    xp.display_name,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(xp.total_xp, 0),
    COALESCE(xp.current_rank, 'Prata I'),
    COALESCE(xp.streak_days, 0),
    COALESCE(ua.plan, 'free'),
    ua.access_expires_at,
    cd.casatrade_user_id,
    COALESCE(cd.total_deposited, 0),
    COALESCE(cd.deposit_count, 0),
    cd.ftd_date::timestamptz,
    cd.ftd_amount,
    COALESCE(cd.current_balance, 0),
    ws.ws_total_deposited,
    ws.ws_deposit_count,
    ws.ws_ftd_date,
    ws.ws_ftd_amount,
    COALESCE(lp.aulas_assistidas, 0),
    pr.whatsapp,
    pr.genero,
    pr.birth_date
  FROM auth.users u
  LEFT JOIN public.user_xp        xp ON xp.user_id = u.id
  LEFT JOIN public.user_access    ua ON ua.user_id = u.id
  LEFT JOIN public.casatrade_data cd ON lower(cd.email) = lower(u.email::text)
  LEFT JOIN public.profiles       pr ON pr.id = u.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS aulas_assistidas
    FROM public.lesson_progress lpp
    WHERE lpp.user_id = u.id
  ) lp ON true
  LEFT JOIN LATERAL (
    SELECT
      SUM(bh.valor_variacao)                   AS ws_total_deposited,
      COUNT(*)                                 AS ws_deposit_count,
      MIN(bh.registrado_em)                    AS ws_ftd_date,
      (ARRAY_AGG(bh.valor_variacao ORDER BY bh.registrado_em ASC))[1] AS ws_ftd_amount
    FROM public.casatrade_balance_history bh
    WHERE bh.user_id = u.id
      AND bh.deposito_detectado = true
  ) ws ON true
  ORDER BY u.created_at DESC;
END;
$function$;

-- =========================================================================
-- Permissoes (forma do projeto -- ver 20260607000000_casatrade_postback_idempotency.sql:135-138).
-- REVOKE de PUBLIC e anon: fecha o default do Postgres (CREATE concede EXECUTE a
-- PUBLIC), que provavelmente esta ativo desde o DROP+CREATE do 20260509120914 e
-- permite chamada SEM LOGIN via PostgREST.
-- authenticated MANTEM EXECUTE: src/pages/Admin.tsx:1081 chama a RPC do browser
-- como authenticated. A autorizacao agora e feita pelo guard has_role DENTRO da
-- funcao -- um nao-admin recebe 'forbidden' (tratado em Admin.tsx:1082).
-- service_role NAO e concedido: nenhuma edge function chama esta RPC
-- (grep em supabase/functions/ = zero hits). ATENCAO: "nao conceder" != "revogar".
-- O service_role provavelmente JA tem EXECUTE por default privileges -- prova viva
-- no repo: public.get_user_id_by_email (20260508224853:20) nao tem GRANT nenhum e
-- mesmo assim roda em producao via service_role (functions/cakto-webhook/index.ts:35,76).
-- Quem barra o service_role aqui e o GUARD, nao a ACL: sem JWT de usuario o
-- auth.uid() e NULL -> has_role(NULL,'admin') = false -> 'forbidden'.
-- =========================================================================
REVOKE EXECUTE ON FUNCTION public.admin_crm_report() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_crm_report() FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_crm_report() TO authenticated;
