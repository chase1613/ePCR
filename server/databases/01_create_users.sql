CREATE SEQUENCE IF NOT EXISTS users_id_seq;

CREATE TABLE public.users (
  id          integer      NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  employee_id varchar      NOT NULL UNIQUE,
  name        varchar      NOT NULL,
  email       varchar      NOT NULL UNIQUE,
  password    varchar      NOT NULL,
  department  varchar,
  position    varchar,
  role        varchar      DEFAULT 'user',
  is_active   boolean      DEFAULT true,
  created_at  timestamp    DEFAULT now(),
  last_seen   timestamptz,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);