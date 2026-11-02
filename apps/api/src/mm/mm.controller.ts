import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ConvertPrDto,
  CreatePoDto,
  CreatePrDto,
  PostGrDto,
  PostInvoiceDto,
} from './mm.dto';
import { MmService } from './mm.service';

@Controller()
export class MmController {
  constructor(private readonly mm: MmService) {}

  @Get('purchase-requisitions')
  listPr() {
    return this.mm.listPr();
  }

  @Post('purchase-requisitions')
  createPr(@Body() dto: CreatePrDto) {
    return this.mm.createPr(dto);
  }

  @Get('purchase-requisitions/:id')
  getPr(@Param('id', ParseIntPipe) id: number) {
    return this.mm.getPr(id);
  }

  @Post('purchase-requisitions/:id/release')
  release(@Param('id', ParseIntPipe) id: number) {
    return this.mm.releasePr(id);
  }

  @Post('purchase-requisitions/:id/convert')
  convert(@Param('id', ParseIntPipe) id: number, @Body() dto: ConvertPrDto) {
    return this.mm.convertPr(id, dto);
  }

  @Get('purchase-orders')
  listPo() {
    return this.mm.listPo();
  }

  @Post('purchase-orders')
  createPo(@Body() dto: CreatePoDto) {
    return this.mm.createPo(dto);
  }

  @Get('purchase-orders/:id')
  getPo(@Param('id', ParseIntPipe) id: number) {
    return this.mm.getPo(id);
  }

  @Get('goods-receipts')
  listGr() {
    return this.mm.listGr();
  }

  @Get('goods-receipts/:id')
  getGr(@Param('id', ParseIntPipe) id: number) {
    return this.mm.getGr(id);
  }

  @Post('goods-receipts')
  postGr(@Body() dto: PostGrDto) {
    return this.mm.postGr(dto);
  }

  @Get('vendor-invoices')
  listInvoices() {
    return this.mm.listInvoices();
  }

  @Get('vendor-invoices/:id')
  getInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.mm.getInvoice(id);
  }

  @Post('vendor-invoices')
  postInvoice(@Body() dto: PostInvoiceDto) {
    return this.mm.postInvoice(dto);
  }
}
