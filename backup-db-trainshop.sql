--
-- PostgreSQL database dump
--

\restrict H12j8UvVl3sENrrwa0BdtjhBHWa9yW6S20efJ1g4UVvnz0GKEfo7BAT0ayp35fL

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: trainshop
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    total_price_cents integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.orders OWNER TO trainshop;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: trainshop
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO trainshop;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: trainshop
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: trainshop
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text NOT NULL,
    price_cents integer NOT NULL,
    stock integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.products OWNER TO trainshop;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: trainshop
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO trainshop;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: trainshop
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: trainshop
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: trainshop
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: trainshop
--

COPY public.orders (id, product_id, quantity, total_price_cents, status, created_at) FROM stdin;
1	1	2	9000	pending	2026-06-01 08:58:02.828667+00
2	3	1	1900	completed	2026-06-01 08:58:02.828667+00
3	2	3	11700	pending	2026-06-01 08:58:02.828667+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: trainshop
--

COPY public.products (id, name, description, price_cents, stock) FROM stdin;
1	Billet Lyon → Paris	Trajet direct pour découvrir Docker.	4500	20
2	Billet Lyon → Marseille	Trajet pour un atelier DevOps.	3900	15
3	Guide Docker débutant	Support pédagogique pour comprendre les conteneurs.	1900	50
4	Pack GitHub Actions	Pack fictif pour apprendre la CI/CD.	2900	30
\.


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trainshop
--

SELECT pg_catalog.setval('public.orders_id_seq', 3, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: trainshop
--

SELECT pg_catalog.setval('public.products_id_seq', 4, true);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: trainshop
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: trainshop
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: trainshop
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict H12j8UvVl3sENrrwa0BdtjhBHWa9yW6S20efJ1g4UVvnz0GKEfo7BAT0ayp35fL

