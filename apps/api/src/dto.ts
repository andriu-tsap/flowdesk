import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsISO8601,
  IsIn,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(128) password!: string;
}
export class BookingDto {
  @ApiProperty() @IsString() @MaxLength(100) employeeId!: string;
  @ApiProperty() @IsString() @MaxLength(100) serviceId!: string;
  @ApiProperty() @IsISO8601() startsAt!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
export class LeadDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsInt() @Min(0) @Max(100000000) value!: number;
  @ApiProperty() @IsString() @MaxLength(2000) note!: string;
}
export class MoveLeadDto {
  @ApiProperty({ enum: ['nowy', 'kontakt', 'oferta', 'umowa'] })
  @IsIn(['nowy', 'kontakt', 'oferta', 'umowa'])
  stage!: 'nowy' | 'kontakt' | 'oferta' | 'umowa';
}
export class CancelDto {
  @ApiProperty({ enum: ['CANCELLED'] })
  @IsIn(['CANCELLED'])
  status!: 'CANCELLED';
}
export class InvoiceDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(100000000) amount!: number;
}
