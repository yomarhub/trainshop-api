const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn()
}));

describe('GET /products', () => {
  it('should return products list', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: 'Guide Docker',
          description: 'Support pédagogique',
          price_cents: 1900,
          stock: 20
        }
      ]
    });

    const response = await request(app).get('/products');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Guide Docker');
  });
});

describe('POST /products', () => {
  it('should create a new product', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          name: 'Guide Docker',
          description: 'Support pédagogique',
          price_cents: 2900,
          stock: 15
        }
      ]
    });

    const newProduct = {
      name: 'Guide Docker',
      description: 'Support pédagogique',
      price_cents: 2900,
      stock: 15
    };

    const response = await request(app).post('/products').send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Guide Docker');
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app).post('/products').send({
      name: 'Guide Incomplete'
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('name, description et price_cents sont obligatoires');
  });

  it('should return 500 if database error occurs', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).post('/products').send({
      name: 'Guide Error',
      description: 'Support pédagogique',
      price_cents: 2900,
      stock: 15
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Impossible de créer le produit');
    expect(response.body.message).toBe('Database error');
  });
});