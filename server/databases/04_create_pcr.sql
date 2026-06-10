CREATE SEQUENCE IF NOT EXISTS pcr_id_seq;

CREATE TABLE public.pcr (
  id         integer    NOT NULL DEFAULT nextval('pcr_id_seq'::regclass),
  user_id    integer,
  period     varchar,
  core       jsonb,
  strategic  jsonb,
  support    jsonb,
  created_at timestamp  DEFAULT now(),
  name       varchar,
  position   varchar,
  division   varchar,
  CONSTRAINT pcr_pkey    PRIMARY KEY (id),
  CONSTRAINT pcr_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id)
);
