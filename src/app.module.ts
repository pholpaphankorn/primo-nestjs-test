import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoModule } from './crypto/crypto.module';

@Module({
  imports: [
    // Load the .env file globally so it's accessible in your service
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CryptoModule,
  ],
})
export class AppModule {}