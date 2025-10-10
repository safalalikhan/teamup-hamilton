/*
  Minimal smoke tests for auth flows using supertest.
  - Uses SKIP_DB=true to avoid a real Mongo connection.
  - Mocks the User model with an in-memory store.
*/

process.env.NODE_ENV = 'test';
process.env.SKIP_DB = 'true';
process.env.JWT_SECRET = 'test-secret';

// Very small in-memory mock for the User model
jest.mock('../models/User', () => {
  const store = { users: [], idCounter: 1 };
  class UserDoc {
    constructor(obj) {
      Object.assign(this, obj);
      this._id = this._id || String(store.idCounter++);
    }
    async save() {
      const idx = store.users.findIndex((u) => u._id === this._id);
      if (idx >= 0) store.users[idx] = this; else store.users.push(this);
      return this;
    }
    toObject() { return { ...this }; }
  }
  return {
    __esModule: true,
    default: null,
    findOne: async (query) => {
      if (query.email) return store.users.find((u) => u.email === query.email) || null;
      return null;
    },
    create: async (obj) => {
      const doc = new UserDoc(obj);
      store.users.push(doc);
      return doc;
    },
    findById: async (id) => {
      const doc = store.users.find((u) => String(u._id) === String(id));
      if (!doc) return null;
      return {
        ...doc,
        select() { return { ...doc, password: undefined }; },
        save: async () => doc,
      };
    },
  };
}, { virtual: false });

const request = require('supertest');
const app = require('../server');

describe('Auth smoke', () => {
  test('register returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 't@example.com', password: 'abc12345' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user.email', 't@example.com');
  });

  test('login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 't@example.com', password: 'abc12345' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
