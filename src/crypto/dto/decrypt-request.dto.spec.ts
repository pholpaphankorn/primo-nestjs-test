import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DecryptRequestDto } from './decrypt-request.dto';

describe('DecryptRequestDto', () => {
  const validateDto = (data: any) => {
    const dtoInstance = plainToInstance(DecryptRequestDto, data);
    return validate(dtoInstance);
  };

  it('should pass when both data1 and data2 are valid strings', async () => {
    const data = {
      data1: 'base64-encoded-rsa-key',
      data2: 'iv:base64-encoded-ciphertext',
    };
    const errors = await validateDto(data);

    expect(errors.length).toBe(0);
  });

  describe('data1 validation', () => {
    it('should fail when data1 is missing', async () => {
      const data = { data2: 'some-payload' };
      const errors = await validateDto(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data1');
    });

    it('should fail when data1 is not a string', async () => {
      const data = { data1: 12345, data2: 'some-payload' };
      const errors = await validateDto(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.find((e) => e.property === 'data1')?.constraints,
      ).toHaveProperty('isString');
    });
  });

  describe('data2 validation', () => {
    it('should fail when data2 is missing', async () => {
      const data = { data1: 'some-key' };
      const errors = await validateDto(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data2');
    });

    it('should fail when data2 is not a string', async () => {
      const data = { data1: 'some-key', data2: true };
      const errors = await validateDto(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.find((e) => e.property === 'data2')?.constraints,
      ).toHaveProperty('isString');
    });
  });
});
