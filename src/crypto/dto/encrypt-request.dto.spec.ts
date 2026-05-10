import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EncryptRequestDto } from './encrypt-request.dto';

describe('EncryptRequestDto', () => {
  // Helper function to handle the validation boilerplate
  const validateDto = (data: any) => {
    // plainToInstance simulates how NestJS transforms the incoming JSON into a class instance
    const dtoInstance = plainToInstance(EncryptRequestDto, data);
    return validate(dtoInstance);
  };

  describe('payload validation', () => {
    it('should pass when payload is a valid string within limits (e.g., 10 characters)', async () => {
      const data = { payload: 'helloWorld' };
      const errors = await validateDto(data);
      
      expect(errors.length).toBe(0);
    });

    it('should pass when payload is exactly at the lower boundary (0 characters)', async () => {
      const data = { payload: '' };
      const errors = await validateDto(data);
      
      expect(errors.length).toBe(0);
    });

    it('should pass when payload is exactly at the upper boundary (2000 characters)', async () => {
      const data = { payload: 'A'.repeat(2000) };
      const errors = await validateDto(data);
      
      expect(errors.length).toBe(0);
    });

    it('should fail when payload exceeds 2000 characters', async () => {
      const data = { payload: 'A'.repeat(2001) };
      const errors = await validateDto(data);
      
      expect(errors.length).toBeGreaterThan(0);
      // Checking the specific constraint that failed
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should fail when payload is not a string', async () => {
      const data = { payload: 12345 };
      const errors = await validateDto(data);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail when payload is missing (null/undefined)', async () => {
      const data = {};
      const errors = await validateDto(data);
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});