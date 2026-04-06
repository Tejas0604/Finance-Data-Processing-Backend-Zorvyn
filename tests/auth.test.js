/**
 * Auth API Tests
 */

const { app, request, cleanup } = require('./setup');

afterAll(cleanup);

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.username).toBe('testuser1');
    expect(res.body.data.user.role).toBe('viewer');
    expect(res.body.data.token).toBeDefined();
    // Password should NOT be in the response
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('should register a user with a specific role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('admin');
  });

  it('should reject duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser1', // already exists
        email: 'unique@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'uniqueuser',
        email: 'test1@example.com', // already exists
        password: 'password123',
      });

    expect(res.status).toBe(409);
  });

  it('should reject invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ab', // too short
        email: 'invalid-email',
        password: '123', // too short
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anothernew',
        email: 'another@example.com',
        password: 'password123',
        role: 'superadmin', // invalid
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser1', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('testuser1');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser1', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'password123' });

    expect(res.status).toBe(401);
  });
});
