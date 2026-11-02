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

export class PrItemDto {
  @IsInt()
  materialId: number;

  @IsInt()
  plantId: number;

  @IsNumber()
  @Min(0.001)
  qty: number;
}

export class CreatePrDto {
  @IsString()
  @IsOptional()
  requester?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrItemDto)
  items: PrItemDto[];
}

export class PoItemDto {
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

export class CreatePoDto {
  @IsInt()
  vendorId: number;

  @IsInt()
  @IsOptional()
  prId?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PoItemDto)
  items: PoItemDto[];
}

export class ConvertPrDto {
  @IsInt()
  vendorId: number;

  @IsInt()
  storageLocationId: number;
}

export class QtyItemDto {
  @IsInt()
  poItemId: number;

  @IsNumber()
  @Min(0.001)
  qty: number;
}

export class PostGrDto {
  @IsInt()
  poId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QtyItemDto)
  items: QtyItemDto[];
}

export class PostInvoiceDto {
  @IsInt()
  poId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QtyItemDto)
  items: QtyItemDto[];
}
