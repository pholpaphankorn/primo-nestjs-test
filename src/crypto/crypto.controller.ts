import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';
import { EncryptRequestDto } from './dto/encrypt-request.dto';
import { DecryptRequestDto } from './dto/decrypt-request.dto';

@ApiTags('Crypto Operations')
@Controller() // Routes are defined directly (e.g., /get-encrypt-data)
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post('encrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encrypt a string payload using AES and RSA' })
  @ApiBody({ type: EncryptRequestDto })
  @ApiResponse({
    status: 200,
    description:
      'Returns RSA-encrypted AES key (data1) and AES-encrypted payload (data2)',
  })
  async encryptData(@Body() body: EncryptRequestDto) {
    // Service returns { data1: string, data2: string }
    const result = await this.cryptoService.encryptData(body.payload);

    return {
      successful: true,
      error_code: '',
      data: result,
    };
  }

  @Post('decrypt-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decrypt data1 and data2 to recover the original payload',
  })
  @ApiBody({ type: DecryptRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Returns the original string payload',
  })
  async decryptData(@Body() body: DecryptRequestDto) {
    // Service returns the decrypted string
    const payload = await this.cryptoService.decryptData(
      body.data1,
      body.data2,
    );

    return {
      successful: true,
      error_code: '',
      data: {
        payload: payload,
      },
    };
  }
}
