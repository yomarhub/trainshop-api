// Express sert à créer l'API HTTP.
const express = require("express");

// On importe le middleware qui log chaque requête.
const requestLogger = require("./middlewares/requestLogger");

// On importe la connexion ou les fonctions liées à PostgreSQL.
const db = require("./db");

// On crée l'application Express.
const app = express();
const apiRouter = express.Router();

// Ce middleware permet à Express de lire le JSON envoyé dans les requêtes.
app.use(express.json());

// On active les logs de requêtes pour toutes les routes.
app.use(requestLogger);

// Route de santé simple : elle dit seulement que l'API répond.
apiRouter.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "trainshop-api",
    instance: process.env.INSTANCE_NAME
  });
});

// Route de disponibilité : elle vérifie aussi la dépendance base de données.
apiRouter.get("/ready", async (req, res) => {
  const databaseIsReady = await db.isReady();

  if (!databaseIsReady) {
    return res.status(503).json({ status: "not_ready", database: "disconnected" });
  }

  res.status(200).json({ status: "ready", database: "connected" });
});

// Route métier : récupération du catalogue.
apiRouter.get("/products", async (req, res) => {
  try {
    const products = await db.getProducts();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Route métier : création d'une commande.
apiRouter.post("/orders", async (req, res) => {
  const { product_id, quantity } = req.body;

  // Validation simple : le produit est obligatoire.
  if (!product_id) {
    return res.status(400).json({ error: "product_id is required" });
  }

  // Validation simple : la quantité doit être positive.
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "quantity must be greater than 0" });
  }

  const order = await db.createOrder(product_id, quantity);
  res.status(201).json({ status: "created", order });
});

app.use(apiRouter);
// On exporte app pour pouvoir le tester avec Supertest.
module.exports = app;