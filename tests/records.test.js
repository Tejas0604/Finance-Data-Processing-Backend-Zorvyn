/**
 * Financial Records API Tests
 */

const { app, request, registerUser, createAdmin, cleanup } = require('./setup');

let adminToken;
let viewerToken;
let analystToken;
let createdRecordId;

beforeAll(async () => {
  const admin = await createAdmin();
  adminToken = admin.token;

  const viewer = await registerUser({
    username: 'recViewer',
    email: 'rec_viewer@test.com',
    role: 'viewer',
  });
  viewerToken = viewer.token;

  const analyst = await registerUser({
    username: 'recAnalyst',
    email: 'rec_analyst@test.com',
    role: 'analyst',
  });
  analystToken = analyst.token;
});

afterAll(cleanup);

describe('POST /api/records', () => {
  it('should allow admin to create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'salary',
        date: '2024-01-15',
        description: 'January salary',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(5000);
    expect(res.body.data.type).toBe('income');
    createdRecordId = res.body.data.id;
  });

  it('should deny viewer from creating records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        amount: 100,
        type: 'expense',
        category: 'groceries',
        date: '2024-01-20',
      });

    expect(res.status).toBe(403);
  });

  it('should deny analyst from creating records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        amount: 100,
        type: 'expense',
        category: 'groceries',
        date: '2024-01-20',
      });

    expect(res.status).toBe(403);
  });

  it('should reject invalid record data', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: -100, // negative
        type: 'donation', // invalid type
        // missing category and date
      });

    expect(res.status).toBe(400);
  });

  it('should create multiple records for filtering tests', async () => {
    const records = [
      { amount: 200, type: 'expense', category: 'groceries', date: '2024-01-20', description: 'Weekly shop' },
      { amount: 1800, type: 'expense', category: 'rent', date: '2024-01-01', description: 'Monthly rent' },
      { amount: 3000, type: 'income', category: 'freelance', date: '2024-02-10', description: 'Design project' },
    ];

    for (const rec of records) {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rec);
      expect(res.status).toBe(201);
    }
  });
});

describe('GET /api/records', () => {
  it('should list records for authenticated users', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.records)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('should filter records by type', async () => {
    const res = await request(app)
      .get('/api/records?type=income')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    res.body.records.forEach((r) => {
      expect(r.type).toBe('income');
    });
  });

  it('should filter records by category', async () => {
    const res = await request(app)
      .get('/api/records?category=rent')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    res.body.records.forEach((r) => {
      expect(r.category).toBe('rent');
    });
  });

  it('should filter records by date range', async () => {
    const res = await request(app)
      .get('/api/records?startDate=2024-01-01&endDate=2024-01-31')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    res.body.records.forEach((r) => {
      expect(r.date >= '2024-01-01').toBe(true);
      expect(r.date <= '2024-01-31').toBe(true);
    });
  });

  it('should search records by description', async () => {
    const res = await request(app)
      .get('/api/records?search=salary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records.length).toBeGreaterThan(0);
  });

  it('should paginate results', async () => {
    const res = await request(app)
      .get('/api/records?page=1&limit=2')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/records');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/records/:id', () => {
  it('should return a single record', async () => {
    const res = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdRecordId);
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app)
      .get('/api/records/99999')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/records/:id', () => {
  it('should allow admin to update a record', async () => {
    const res = await request(app)
      .put(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 5500, description: 'Updated salary' });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(5500);
    expect(res.body.data.description).toBe('Updated salary');
  });

  it('should deny viewer from updating records', async () => {
    const res = await request(app)
      .put(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 9999 });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/records/:id', () => {
  it('should deny viewer from deleting records', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin to soft-delete a record', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Verify soft-deleted record is no longer visible
    const getRes = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });
});
