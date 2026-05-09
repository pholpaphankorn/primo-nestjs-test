import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from '../../src/crypto/crypto.service';
import { BadRequestException } from '@nestjs/common';

describe('CryptoService', () => {
  let service: CryptoService;

  // These should match the format of keys from https://cryptotools.net/rsagen
  const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCE4g4/N+m8hueqNyhSQz/WBfi8
inh8ytF4lwla1MYyxSRKQR/jTvJUBDdoViVKE0oWnDzLFG1Fse1RVLpw2nl0A7Cs
FMZOR6dpc0jJwq7DQ6VI1FxlYCB+k+Pb99Mc0l+HT0qvrPlf6chrYNX60MAWTxvN
bcnQPaLyiXYprqUjmwIDAQAB
-----END PUBLIC KEY-----`;

  const mockPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCE4g4/N+m8hueqNyhSQz/WBfi8inh8ytF4lwla1MYyxSRKQR/j
TvJUBDdoViVKE0oWnDzLFG1Fse1RVLpw2nl0A7CsFMZOR6dpc0jJwq7DQ6VI1Fxl
YCB+k+Pb99Mc0l+HT0qvrPlf6chrYNX60MAWTxvNbcnQPaLyiXYprqUjmwIDAQAB
AoGAGtqD/oqSFaM9lcxnvZgRgnLafV+OUcm64x/CqDRviTsFxmu6wfjmR8xCVjdy
ebHEOyV/s5qBKqB2UQVKWBwOhvS4eBuG08X0QGdeyPyUW1w98pyS+Xpd23UY6dCg
Bj0aKfD4+NNrhiq9UtBPm5kX7HElFaNGST/pvMGXlL8ZpsECQQDEE0nlGw2Aamiz
UfGVHSd2ZMyeezbqQd3t2+TeiyGUCjIJduW9IUk97qSpJ6+cL0RHAC+W6MRB7T1Q
9iucjJYpAkEArX6sGjH0X3odrJK18DrIF+pzz7Y69cQ6EVdkUcPd6w3VGJ4EnRtm
4jcRrzTUMwdRvYs1wyoaKtDpMP5cu8M8IwJBAI6ZdKGSFjSxrunTi74l0OBzGLmd
5Odj9fKafQ4447fV3mQxu43cWncXS1vWiAov+hklEndPXASSdIigMEGPoVkCQAzk
atmPeL9XjbjzNf3iAFh2naCDxCHbMQ101wmUans7DejEZUdfb+fDe9bvMA2Sr6pM
G/SivksMNyfi3vU87s0CQETcgGJUvj/jpAii4oAG1r7ZnKVB2+Hs2bIjoiiUEA6K
6oMyWTLrzAmZlpkDqumn9UGeNKSuaGoIjbrLK3Ah7h8=
-----END RSA PRIVATE KEY-----`;

  beforeEach(async () => {
    // Inject mock keys into process.env before the service initializes
    process.env.RSA_PUBLIC_KEY = mockPublicKey;
    process.env.RSA_PRIVATE_KEY = mockPrivateKey;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Encryption & Decryption Flow', () => {
    it('should successfully encrypt a payload and decrypt it back to original', async () => {
      const originalPayload = 'Hello NestJS Job Test';

      // 1. Encrypting
      const encryptedResult = await service.encryptData(originalPayload);
      expect(encryptedResult).toHaveProperty('data1');
      expect(encryptedResult).toHaveProperty('data2');
      expect(typeof encryptedResult.data1).toBe('string');

      // 2. Decrypting
      const decryptedPayload = await service.decryptData(
        encryptedResult.data1,
        encryptedResult.data2,
      );

      // 3. Assertion
      expect(decryptedPayload).toEqual(originalPayload);
    });

    it('should handle special characters and long strings (up to 2000 chars)', async () => {
      const longPayload = 'A'.repeat(2000);
      const encrypted = await service.encryptData(longPayload);
      const decrypted = await service.decryptData(
        encrypted.data1,
        encrypted.data2,
      );

      expect(decrypted).toEqual(longPayload);
      expect(decrypted.length).toBe(2000);
    });
  });

  describe('Error Handling', () => {
    it('should throw BadRequestException if data1 (RSA) is malformed', async () => {
      const data1 = 'invalid-base64-data';
      const data2 = 'iv:payload';

      await expect(service.decryptData(data1, data2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if data2 (AES) is tampered with', async () => {
      const payload = 'Secret Message';
      const encrypted = await service.encryptData(payload);

      // Tamper with the data2 string
      const tamperedData2 = encrypted.data2 + 'tampered';

      await expect(
        service.decryptData(encrypted.data1, tamperedData2),
      ).rejects.toThrow(BadRequestException);
    });
    it('should throw BadRequestException if data2 (AES) is corrupted', async () => {
      const payload = 'Secret Message';
      const encrypted = await service.encryptData(payload);

      // Properly tamper: corrupt a byte inside the encrypted payload segment
      const parts = encrypted.data2.split(':');
      const payloadBytes = Buffer.from(parts[1], 'base64');
      payloadBytes[0] ^= 0xff; // flip all bits in the first byte
      parts[1] = payloadBytes.toString('base64');
      const tamperedData2 = parts.join(':');

      await expect(
        service.decryptData(encrypted.data1, tamperedData2),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
