import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EncryptRequestDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @Length(0, 2000)
  payload!: string;
}