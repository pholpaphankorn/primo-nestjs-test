import { Test, TestingModule } from '@nestjs/testing';
import { CryptoController } from './crypto.controller';
import { CryptoService } from './crypto.service';

describe('CryptoController', () => {
  let controller: CryptoController;
  let service: CryptoService;

  // Create a mock service
  const mockCryptoService = {
    encryptData: jest.fn(),
    decryptData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptoController],
      providers: [
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    controller = module.get<CryptoController>(CryptoController);
    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('encryptData', () => {
    it('should call service.encryptData and return wrapped response', async () => {
      const mockResult = { data1: 'rsa_key', data2: 'aes_data' };
      const payload = { payload: 'hello' };
      
      // Tell the mock what to return
      mockCryptoService.encryptData.mockResolvedValue(mockResult);

      const response = await controller.encryptData(payload);

      expect(service.encryptData).toHaveBeenCalledWith('hello');
      expect(response).toEqual({
        successful: true,
        error_code: '',
        data: mockResult,
      });
    });
  });

  describe('decryptData', () => {
    it('should call service.decryptData and return wrapped response', async () => {
      const mockPayload = 'original_message';
      const body = { data1: 'key', data2: 'data' };
      
      mockCryptoService.decryptData.mockResolvedValue(mockPayload);

      const response = await controller.decryptData(body);

      expect(service.decryptData).toHaveBeenCalledWith('key', 'data');
      expect(response).toEqual({
        successful: true,
        error_code: '',
        data: { payload: mockPayload },
      });
    });
  });
});