import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Crypto Operations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // IMPORTANT: Mirror the configuration from main.ts so the test environment
    // behaves exactly like the production/dev environment.
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
  });

  describe('Encryption & Decryption Flow', () => {
    let savedData1: string;
    let savedData2: string;
    const originalPayload = 'Hello, this is a secure message from Bangkok!';

    it('/encrypt-data (POST) - Success', async () => {
      const response = await request(app.getHttpServer())
        .post('/encrypt-data')
        .send({ payload: originalPayload })
        .expect(200);

      expect(response.body.successful).toBe(true);
      expect(response.body.data).toHaveProperty('data1');
      expect(response.body.data).toHaveProperty('data2');

      // Save for the decryption test
      savedData1 = response.body.data.data1;
      savedData2 = response.body.data.data2;
    });

    it('/decrypt-data (POST) - Success', async () => {
      const response = await request(app.getHttpServer())
        .post('/decrypt-data')
        .send({ data1: savedData1, data2: savedData2 })
        .expect(200);

      expect(response.body.successful).toBe(true);
      expect(response.body.data.payload).toBe(originalPayload);
    });
  });

  describe('Security & Validation Guardrails', () => {
    it('/encrypt-data (POST) - Fail on payload > 2000 chars', async () => {
      const longPayload = 'A'.repeat(2001);

      const response = await request(app.getHttpServer())
        .post('/encrypt-data')
        .send({ payload: longPayload })
        .expect(400);

      // Verify our GlobalExceptionFilter is working
      expect(response.body.successful).toBe(false);
      expect(response.body.error_code).toBe('BAD_REQUEST');
    });

    it('/decrypt-data (POST) - Fail on tampered data', async () => {
      // Create a tampered string by modifying the ciphertext
      const tamperedData2 = 'invalid_iv:invalid_payload';

      const response = await request(app.getHttpServer())
        .post('/decrypt-data')
        .send({ data1: 'invalid_data1', data2: tamperedData2 })
        .expect(400);

      expect(response.body.successful).toBe(false);
      expect(response.body.error_code).toBe('BAD_REQUEST');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
