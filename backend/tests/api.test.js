const request = require('supertest');
const express = require('express');
const apiRoutes = require('../src/routes/api');
const app = express();

app.use(express.json());
app.use('/api/v1', apiRoutes);

describe('API Endpoints', () => {
    test('POST /api/v1/tna/request - Should fail if ID is missing', async () => {
        const res = await request(app)
            .post('/api/v1/tna/request')
            .send({}); // Empty body
        
        expect(res.statusCode).not.toBe(201);
    });
});