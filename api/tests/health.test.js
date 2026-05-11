const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] })
}));

describe('GET /health', () => {
  it('should return alive status with no dependencies check', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('trainshop-api');
    expect(response.body.version).toBeDefined();
    expect(response.body.environment).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime_seconds).toBeDefined();
  });

  it('should return service name in health response', async () => {
    const response = await request(app).get('/health');

    expect(response.body.service).toBe('trainshop-api');
  });

  it('should not expose sensitive information', async () => {
    const response = await request(app).get('/health');

    const bodyStr = JSON.stringify(response.body);
    expect(bodyStr).not.toMatch(/password|secret|token|DATABASE_URL/i);
  });
});

describe('GET /ready', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return ready status when database is accessible', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }] });

    const response = await request(app).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.service).toBe('trainshop-api');
    expect(response.body.checks.database.status).toBe('connected');
    expect(response.body.checks.environment.status).toBe('ok');
  });

  it('should return not-ready status when database is unavailable', async () => {
    pool.query.mockRejectedValueOnce(new Error('Connection timeout'));

    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not-ready');
    expect(response.body.checks.database.status).toBe('unavailable');
  });

  it('should include timestamp and version in readiness response', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }] });

    const response = await request(app).get('/ready');

    expect(response.body.timestamp).toBeDefined();
    expect(response.body.version).toBeDefined();
    expect(response.body.checks).toBeDefined();
  });

  it('should check environment variables in readiness response', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }] });

    const response = await request(app).get('/ready');

    expect(response.body.checks.environment).toBeDefined();
    expect(response.body.checks.environment.status).toBeDefined();
  });
});
