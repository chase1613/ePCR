CREATE TABLE public.divisions (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT divisions_pkey PRIMARY KEY (id)
);