const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

jest.mock('../src/db', () => ({
    query: jest.fn()
}));

describe('POST /orders', () => {
    it('should create a new order and decrement stock', async () => {
        pool.query
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ id: 1, price_cents: 4500, stock: 20 }]
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        product_id: 1,
                        quantity: 2,
                        total_price_cents: 9000,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    }
                ]
            })
            .mockResolvedValueOnce({ rows: [{ stock: 18 }] })
            .mockResolvedValueOnce({});

        const response = await request(app).post('/orders').send({
            product_id: 1,
            quantity: 2
        });

        expect(response.status).toBe(201);
        expect(response.body.product_id).toBe(1);
        expect(response.body.status).toBe('pending');
        expect(response.body.total_price_cents).toBe(9000);
    });

    it('should return 400 when required fields are missing', async () => {
        const response = await request(app).post('/orders').send({
            product_id: 1
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('product_id et quantity sont obligatoires et quantity doit être supérieur à 0');
    });

    it('should return 404 when the product does not exist', async () => {
        pool.query
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ rowCount: 0, rows: [] });

        const response = await request(app).post('/orders').send({
            product_id: 999,
            quantity: 1
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Produit introuvable');
    });
});

describe('POST /checkout', () => {
    it('should validate a pending payment', async () => {
        pool.query
            .mockResolvedValueOnce({
                rowCount: 1,
                rows: [{ id: 10, status: 'pending', product_id: 1, quantity: 2, total_price_cents: 9000 }]
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 10,
                        product_id: 1,
                        quantity: 2,
                        total_price_cents: 9000,
                        status: 'paid'
                    }
                ]
            });

        const response = await request(app).post('/checkout').send({ order_id: 10 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Paiement validé');
        expect(response.body.order.status).toBe('paid');
    });

    it('should return 400 when order_id is missing', async () => {
        const response = await request(app).post('/checkout').send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('order_id est obligatoire');
    });

    it('should return 404 when the order does not exist', async () => {
        pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

        const response = await request(app).post('/checkout').send({ order_id: 999 });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Commande introuvable');
    });

    it('should return 400 when the order is already paid', async () => {
        pool.query.mockResolvedValueOnce({
            rowCount: 1,
            rows: [{ id: 10, status: 'paid', product_id: 1, quantity: 2, total_price_cents: 9000 }]
        });

        const response = await request(app).post('/checkout').send({ order_id: 10 });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('La commande a déjà été payée');
    });
});
