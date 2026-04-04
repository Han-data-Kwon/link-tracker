-- ──────────────────────────────────────────────
-- 확장
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────
-- profiles (auth.users 와 1:1)
-- ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT        NOT NULL DEFAULT 'viewer'
                          CHECK (role IN ('admin', 'editor', 'viewer')),
  is_allowed  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- tags
-- ──────────────────────────────────────────────
CREATE TABLE public.tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  color      TEXT        NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- links
-- ──────────────────────────────────────────────
CREATE TABLE public.links (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,

  slug            TEXT        NOT NULL UNIQUE,
  title           TEXT,
  destination_url TEXT        NOT NULL,
  full_url        TEXT        NOT NULL,

  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,

  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_links_slug       ON public.links (slug);
CREATE INDEX idx_links_user_id    ON public.links (user_id);
CREATE INDEX idx_links_utm_source ON public.links (utm_source);
CREATE INDEX idx_links_campaign   ON public.links (utm_campaign);
CREATE INDEX idx_links_created_at ON public.links (created_at DESC);

-- ──────────────────────────────────────────────
-- link_tags (다대다)
-- ──────────────────────────────────────────────
CREATE TABLE public.link_tags (
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

CREATE INDEX idx_link_tags_tag_id ON public.link_tags (tag_id);

-- ──────────────────────────────────────────────
-- clicks
-- ──────────────────────────────────────────────
CREATE TABLE public.clicks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id     UUID        NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,

  visitor_id  TEXT,
  ip_hash     TEXT,

  user_agent  TEXT,
  referer     TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser     TEXT,
  os          TEXT,

  country     TEXT,
  city        TEXT,

  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clicks_link_id    ON public.clicks (link_id);
CREATE INDEX idx_clicks_visitor_id ON public.clicks (visitor_id);
CREATE INDEX idx_clicks_clicked_at ON public.clicks (clicked_at DESC);
CREATE INDEX idx_clicks_link_date  ON public.clicks (link_id, clicked_at DESC);
