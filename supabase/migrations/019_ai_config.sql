-- ============================================================================
-- AI Configuration Table
-- Version: 1.0
--
-- Stores AI provider settings so admins can configure which LLM to use
-- (Groq, Gemini, OpenAI, etc.) and the API credentials, without redeploying
-- code.
--
-- Also stores fallback behavior: if the LLM call fails or returns an error,
-- the system falls back to the keyword-based ranker.
--
-- How to run:
--   Supabase Dashboard > SQL Editor > paste entire content > Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_config (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default configuration: use keyword ranker (no LLM)
INSERT INTO public.ai_config (key, value, description)
VALUES
  ('provider',       'keyword',    'AI provider: keyword, groq, gemini, openai'),
  ('model',         '',           'Model name for the LLM (e.g. llama-3.3-70b-versatile, gemini-1.5-flash, gpt-4o-mini)'),
  ('api_key',       '',           'API key for the selected provider (stored as-is, use env var in production)'),
  ('api_endpoint',  '',           'Optional custom endpoint URL'),
  ('fallback',      'true',       'Whether to fall back to keyword ranker on error: true or false'),
  ('max_context',   '3000',       'Max characters of knowledge base context to send to LLM'),
  ('enabled',       'true',       'Master switch: true or false')
ON CONFLICT (key) DO NOTHING;

-- RLS: only Managers and Administrators can read/write
CREATE POLICY "ai_config_read_admin" ON public.ai_config
  FOR SELECT TO authenticated USING (
    public.has_role('Administrator')
    OR public.has_role('Manager')
  );

CREATE POLICY "ai_config_update_admin" ON public.ai_config
  FOR UPDATE TO authenticated USING (
    public.has_role('Administrator')
    OR public.has_role('Manager')
  );

-- Verify:
-- SELECT * FROM public.ai_config ORDER BY key;
