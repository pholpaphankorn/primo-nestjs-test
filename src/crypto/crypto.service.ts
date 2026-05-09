import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'node:crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly rsaPublicKey = process.env.RSA_PUBLIC_KEY!;
  private readonly rsaPrivateKey = process.env.RSA_PRIVATE_KEY!;

  // 1. GET ENCRYPT DATA
  async encryptData(payload: string) {
    try {
      // Step 2: Create AES key (32 bytes for AES-256)
      const aesKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16); // Required for GCM mode

      // Step 3: Encrypt payload with AES key
      const cipher = crypto.createCipheriv(this.algorithm, aesKey, iv);
      let encryptedPayload = cipher.update(payload, 'utf8', 'base64');
      encryptedPayload += cipher.final('base64');

      // Step 3b: Get GCM auth tag (used to detect tampering on decrypt)
      const authTag = cipher.getAuthTag().toString('base64');

      // For data2: We combine IV + EncryptedPayload + AuthTag so we can decrypt it later
      const data2 = `${iv.toString('base64')}:${encryptedPayload}:${authTag}`;

      // Step 4: Encrypt AES Key with RSA Public Key (Standard Way)
      // NOTE: To follow image_f02b78.png, use crypto.privateEncrypt instead.

      const data1 = crypto
        .publicEncrypt(
          {
            key: this.rsaPublicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          aesKey,
        )
        .toString('base64');

      return { data1, data2 };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        'Encryption failed. Error Message: ' + message,
      );
    }
  }

  // 2. GET DECRYPT DATA
  async decryptData(data1: string, data2: string) {
    try {
      // Step 2: Decrypt AES Key with RSA Private Key (Standard Way)
      // NOTE: To follow image_f02b78.png, use crypto.publicDecrypt instead.
      const aesKey = crypto.privateDecrypt(
        {
          key: this.rsaPrivateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(data1, 'base64'),
      );

      // Step 3: Decrypt data2 with AES key
      const [ivBase64, encryptedPayload, authTagBase64] = data2.split(':');

      if (!ivBase64 || !encryptedPayload || !authTagBase64) {
        throw new Error('Invalid data2 format');
      }
      // ✅ Strict length validation — catches appended garbage like 'tampered'
      // IV  = 16 bytes = 24 base64 chars
      // Auth tag = 16 bytes = 24 base64 chars
      if (ivBase64.length !== 24 || authTagBase64.length !== 24) {
        throw new Error('Invalid segment length');
      }
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      const decipher = crypto.createDecipheriv(this.algorithm, aesKey, iv);

      // Step 3b: Set the GCM auth tag — decipher.final() will throw if
      // the ciphertext or tag has been tampered with
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedPayload, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        'Decryption failed. Check your keys or input. Error Message: ' +
          message,
      );
    }
  }
}
