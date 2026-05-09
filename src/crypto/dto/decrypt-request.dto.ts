import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DecryptRequestDto {
  @ApiProperty()
  @IsString()
  data1!: string;

  @ApiProperty()
  @IsString()
  data2!: string;
}
