CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price_cents INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO products (name, description, price_cents, stock)
VALUES
  ('Billet Lyon → Paris', 'Trajet direct pour découvrir Docker.', 4500, 20),
  ('Billet Lyon → Marseille', 'Trajet pour un atelier DevOps.', 3900, 15),
  ('Guide Docker débutant', 'Support pédagogique pour comprendre les conteneurs.', 1900, 50),
  ('Pack GitHub Actions', 'Pack fictif pour apprendre la CI/CD.', 2900, 30);

INSERT INTO orders (product_id, quantity, total_price_cents, status)
VALUES
  (1, 2, 9000, 'pending'),
  (3, 1, 1900, 'completed'),
  (2, 3, 11700, 'pending');
