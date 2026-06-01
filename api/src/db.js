// Pool vient du module pg et gère les connexions PostgreSQL.
const { Pool } = require("pg");

// On crée un pool de connexions avec les variables d'environnement.
// Ces valeurs viennent souvent du fichier .env ou de Docker Compose.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Fonction utilisée par /ready pour vérifier si la base répond.
async function isReady() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    return false;
  }
}

// Fonction métier : lit les produits dans PostgreSQL.
async function getProducts() {
  const result = await pool.query("SELECT id, name, price FROM products ORDER BY id");
  return result.rows;
}

// Fonction métier : crée une commande.
async function createOrder(productId, quantity) {
  const result = await pool.query(
    "INSERT INTO orders(product_id, quantity) VALUES($1, $2) RETURNING id, product_id, quantity",
    [productId, quantity]
  );

  return result.rows[0];
}

// On exporte les fonctions utilisées dans app.js et les tests.
module.exports = {
  isReady,
  getProducts,
  createOrder
};