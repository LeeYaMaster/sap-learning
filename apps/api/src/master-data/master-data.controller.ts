import { Body, Controller, Get, Post } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { CreateMaterialDto, CreatePartnerDto } from './master-data.dto';

@Controller()
export class MasterDataController {
  constructor(private readonly master: MasterDataService) {}

  @Get('org')
  org() {
    return this.master.org();
  }

  @Get('materials')
  materials() {
    return this.master.materials();
  }

  @Post('materials')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.master.createMaterial(dto);
  }

  @Get('customers')
  customers() {
    return this.master.customers();
  }

  @Post('customers')
  createCustomer(@Body() dto: CreatePartnerDto) {
    return this.master.createCustomer(dto);
  }

  @Get('vendors')
  vendors() {
    return this.master.vendors();
  }

  @Post('vendors')
  createVendor(@Body() dto: CreatePartnerDto) {
    return this.master.createVendor(dto);
  }
}
