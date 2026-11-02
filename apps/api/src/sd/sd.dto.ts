import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SoItemDto {
  @IsInt()
  materialId: number;

  @IsInt()
  plantId: number;

  @IsInt()
  storageLocationId: number;

  @IsNumber()
  @Min(0.001)
  qty: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateSoDto {
  @IsInt()
  customerId: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SoItemDto)
  items: SoItemDto[];
}

export class SoQtyItemDto {
  @IsInt()
  soItemId: number;

  @IsNumber()
  @Min(0.001)
  qty: number;
}

export class PostDeliveryDto {
  @IsInt()
  soId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SoQtyItemDto)
  items: SoQtyItemDto[];
}

export class PostBillingDto {
  @IsInt()
  soId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SoQtyItemDto)
  items: SoQtyItemDto[];
}
