const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Configuration
const startTime = Date.now();
const version = process.env.VERSION || 'dev';
const environment = process.env.ENVIRONMENT || 'local';
const serviceName = 'trainshop-api';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur TrainShop Starter',
    endpoints: ['/health', '/ready', '/products', '/orders', '/checkout']
  });
});

app.get('/health', async (req, res) => {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    res.status(200).json({
      status: 'ok',
      service: serviceName,
      version: version,
      environment: environment,
      timestamp: new Date().toISOString(),
      uptime_seconds: uptime
    });
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      service: serviceName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/ready', async (req, res) => {
  const readiness = {
    status: 'ready',
    service: serviceName,
    version: version,
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'unknown', message: null },
      environment: { status: 'ok', message: 'All required environment variables present' }
    }
  };

  try {
    // Vérifier les variables d'environnement obligatoires
    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
      readiness.status = 'not-ready';
      readiness.checks.environment.status = 'failed';
      readiness.checks.environment.message = `Missing environment variables: ${missingVars.join(', ')}`;
    }

    // Vérifier la base de données
    await pool.query('SELECT 1');
    readiness.checks.database.status = 'connected';
    readiness.checks.database.message = 'PostgreSQL database is accessible';

  } catch (error) {
    readiness.status = 'not-ready';
    readiness.checks.database.status = 'unavailable';
    readiness.checks.database.message = `Database connection failed: ${error.message}`;
  }

  // Déterminer le code HTTP basé sur le statut global
  const statusCode = readiness.status === 'ready' ? 200 : 503;
  res.status(statusCode).json(readiness);
});


app.get('/about', async (req, res) => {
  res.json({
    "project": "TrainShop Starter",
    "module": "DevOps",
    "objective": "Créer une CI GitHub Actions"
  });
});

app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cents, stock FROM products ORDER BY id ASC'
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de récupérer les produits',
      message: error.message
    });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cents, stock FROM products WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Produit introuvable'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de récupérer le produit',
      message: error.message
    });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, description, price_cents, stock } = req.body;

    if (!name || !description || !price_cents) {
      return res.status(400).json({
        error: 'name, description et price_cents sont obligatoires'
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price_cents, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, price_cents, stock`,
      [name, description, price_cents, stock || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de créer le produit',
      message: error.message
    });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'product_id et quantity sont obligatoires et quantity doit être supérieur à 0'
      });
    }

    await pool.query('BEGIN');

    const productResult = await pool.query(
      'SELECT id, price_cents, stock FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        error: 'Produit introuvable'
      });
    }

    const product = productResult.rows[0];

    if (product.stock < quantity) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        error: 'Stock insuffisant pour ce produit'
      });
    }

    const total_price_cents = product.price_cents * quantity;

    const orderResult = await pool.query(
      `INSERT INTO orders (product_id, quantity, total_price_cents, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, product_id, quantity, total_price_cents, status, created_at`,
      [product_id, quantity, total_price_cents]
    );

    await pool.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2',
      [quantity, product_id]
    );

    await pool.query('COMMIT');

    res.status(201).json(orderResult.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({
      error: 'Impossible de créer la commande',
      message: error.message
    });
  }
});

app.post('/checkout', async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        error: 'order_id est obligatoire'
      });
    }

    const orderResult = await pool.query(
      'SELECT id, status, product_id, quantity, total_price_cents FROM orders WHERE id = $1',
      [order_id]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        error: 'Commande introuvable'
      });
    }

    const order = orderResult.rows[0];

    if (order.status === 'paid') {
      return res.status(400).json({
        error: 'La commande a déjà été payée'
      });
    }

    const paidResult = await pool.query(
      `UPDATE orders
       SET status = 'paid'
       WHERE id = $1
       RETURNING id, product_id, quantity, total_price_cents, status`,
      [order_id]
    );

    res.json({
      message: 'Paiement validé',
      order: paidResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de valider le paiement',
      message: error.message
    });
  }
});

module.exports = app;
