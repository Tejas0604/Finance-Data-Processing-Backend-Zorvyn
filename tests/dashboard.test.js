/**
 * Dashboard API Tests
 */

const { app, request, registerUser, createAdmin, cleanup } = require('./setup');

let adminToken;
let analystToken;
let viewerToken;

beforeAll(async () => {
  const admin = await createAdmin();
  adminToken = admin.token;

  const analyst = await registerUser({
    username: 'dashAnalyst',
    email: 'dash_analyst@test.com',
    role: 'analyst',
  });
  analystToken = analyst.token;

  const viewer = await registerUser({
    username: 'dashViewer',
    email: 'dash_viewer@test.com',
    role: 'viewer',
  });
  viewerToken = viewer.token;

  // Seed some records
  const records = [
    { amount: 5000, type: 'income', category: 'salary', date: '2024-01-05', description: 'Jan salary' },
    { amount: 3000, type: 'income', category: 'freelance', date: '2024-02-10', description: 'Design work' },
    { amount: 1800, type: 'expense', category: 'rent', date: '2024-01-01', description: 'Rent' },
    { amount: 200, type: 'expense', category: 'groceries', date: '2024-01-15', description: 'Groceries' },
    { amount: 150, type: 'expense', category: 'utilities', date: '2024-02-10', description: 'Electric bill' },
  ];

  for (const rec of records) {
    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(rec);
  }
});

afterAll(cleanup);

describe('GET /api/dashboard/summary', () => {
  it('should return financial summary for admin', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total_income');
    expect(res.body.data).toHaveProperty('total_expenses');
    expect(res.body.data).toHaveProperty('net_balance');
    expect(res.body.data).toHaveProperty('total_records');
    expect(res.body.data.total_income).toBeGreaterThan(0);
  });

  it('should return financial summary for analyst', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('net_balance');
  });

  it('should deny viewer access to summary', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/dashboard/category-summary', () => {
  it('should return category breakdown for analyst', async () => {
    const res = await request(app)
      .get('/api/dashboard/category-summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('category');
    expect(res.body.data[0]).toHaveProperty('income');
    expect(res.body.data[0]).toHaveProperty('expense');
  });

  it('should deny viewer access to category summary', async () => {
    const res = await request(app)
      .get('/api/dashboard/category-summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/dashboard/trends', () => {
  it('should return monthly trends', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('month');
      expect(res.body.data[0]).toHaveProperty('income');
      expect(res.body.data[0]).toHaveProperty('expenses');
    }
  });

  it('should accept months query parameter', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends?months=6')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/dashboard/recent', () => {
  it('should return recent activity for all authenticated users', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should respect limit parameter', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent?limit=3')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
  });

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/dashboard/recent');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('healthy');
  });
});
