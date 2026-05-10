import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './http-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    // 1. Mock the Express Response object
    mockResponse = {
      status: jest.fn().mockReturnThis(), // Allows chaining .status(x).json(y)
      json: jest.fn().mockReturnThis(),
    };

    // 2. Mock the NestJS ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should catch an HttpException and return the formatted JSON', () => {
    const status = HttpStatus.BAD_REQUEST;
    const exception = new HttpException('Test Error', status);

    filter.catch(exception, mockArgumentsHost);

    // Verify status was called with 400
    expect(mockResponse.status).toHaveBeenCalledWith(status);

    // Verify JSON structure matches your requirement
    expect(mockResponse.json).toHaveBeenCalledWith({
      successful: false,
      error_code: 'BAD_REQUEST',
      data: null,
    });
  });

  it('should catch a generic Error and return INTERNAL_SERVER_ERROR', () => {
    const exception = new Error('Generic system crash');

    filter.catch(exception, mockArgumentsHost);

    // Verify it defaults to 500 when the error isn't an HttpException
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      successful: false,
      error_code: 'INTERNAL_SERVER_ERROR',
      data: null,
    });
  });

  it('should handle NOT_FOUND correctly', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      successful: false,
      error_code: 'NOT_FOUND',
      data: null,
    });
  });
});
