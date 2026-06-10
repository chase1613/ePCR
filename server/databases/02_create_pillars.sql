CREATE SEQUENCE IF NOT EXISTS pillars_id_seq;

CREATE TABLE public.pillars (
  id          integer    NOT NULL DEFAULT nextval('pillars_id_seq'::regclass),
  name        varchar    NOT NULL,
  type        varchar    NOT NULL,
  description text,
  weight      integer    NOT NULL DEFAULT 0,
  created_at  timestamp  DEFAULT now(),
  division    varchar    NOT NULL DEFAULT 'General',
  CONSTRAINT pillars_pkey PRIMARY KEY (id)
);
