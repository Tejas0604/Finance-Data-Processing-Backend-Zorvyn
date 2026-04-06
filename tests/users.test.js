/**
 * User Management API Tests
 */

const { app, request, registerUser, createAdmin, cleanup } = require('./setup');

let adminToken;
let viewerToken;
let viewerUser;

beforeAll(async () => {
  const admin = await createAdmin();
  adminToken = admin.token;

  const viewer = await registerUser({ username: 'userViewer', email: 'viewer_test@test.com', role: 'viewer' });
  viewerToken = viewer.token;
  viewerUser = viewer.user;
});

afterAll(cleanup);

describe('GET /api/users', () => {
  it('should allow admin to list all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('should deny viewer access to user list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/me', () => {
  it('should return current user profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('userViewer');
  });
});

describe('PATCH /api/users/:id', () => {
  it('should allow admin to update user role', async () => {
    const res = await request(app)
      .patch(`/api/users/${viewerUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'analyst' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('analyst');
  });

  it('should deny non-admin from updating roles', async () => {
    const res = await request(app)
      .patch(`/api/users/${viewerUser.id}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
  });

  it('should reject invalid role value', async () => {
    const res = await request(app)
      .patch(`/api/users/${viewerUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superadmin' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/:id', () => {
  it('should deactivate user (not hard delete)', async () => {
    // Create a user to deactivate
    const toDeactivate = await registerUser({
      username: 'deactivateMe',
      email: 'deactivate@test.com',
    });

    const res = await request(app)
      .delete(`/api/users/${toDeactivate.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });
});
