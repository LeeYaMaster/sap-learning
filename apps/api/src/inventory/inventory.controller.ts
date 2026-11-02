import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('stock')
  stock() {
    return this.inventory.listStock();
  }

  @Get('stock-movements')
  movements() {
    return this.inventory.listMovements();
  }
}
