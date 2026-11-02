import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  standardPrice?: number;

  @IsString()
  @IsOptional()
  category?: string;
}

export class CreatePartnerDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  city?: string;
}
