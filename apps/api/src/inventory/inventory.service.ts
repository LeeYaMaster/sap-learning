import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { money, qty } from '../common/money';
import {
  Material,
  Plant,
  StorageLocation,
} from '../master-data/master.entities';
import { Stock, StockMovement } from './inventory.entities';

export interface MovementInput {
  material: Material;
  plant: Plant;
  storageLocation: StorageLocation;
  qty: number;
  unitCost?: number;
  movementType: string;
  movementName: string;
  refType: string;
  refNumber: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Stock) private stocks: Repository<Stock>,
    @InjectRepository(StockMovement) private movements: Repository<StockMovement>,
  ) {}

  listStock() {
    return this.stocks.find({ order: { id: 'ASC' } });
  }

  listMovements() {
    return this.movements.find({ order: { id: 'DESC' } });
  }

  async receipt(em: EntityManager, input: MovementInput) {
    const q = qty(input.qty);
    if (q <= 0) throw new BadRequestException('入库数量必须大于 0');
    const unitCost = money(input.unitCost ?? 0);
    const amount = money(q * unitCost);
    const stock = await this.findOrCreate(em, input);
    stock.qty = qty(stock.qty + q);
    stock.value = money(stock.value + amount);
    await em.save(stock);
    await em.save(
      em.create(StockMovement, {
        material: input.material,
        plant: input.plant,
        storageLocation: input.storageLocation,
        qty: q,
        unitCost,
        amount,
        movementType: input.movementType,
        movementName: input.movementName,
        refType: input.refType,
        refNumber: input.refNumber,
      }),
    );
    return { unitCost, amount, qty: q };
  }

  async issue(em: EntityManager, input: MovementInput) {
    const q = qty(input.qty);
    if (q <= 0) throw new BadRequestException('出库数量必须大于 0');
    const stock = await this.findOrCreate(em, input);
    if (stock.qty + 1e-9 < q) {
      throw new BadRequestException(
        `库存不足，无法发货：物料 ${input.material.code} 在 ${input.plant.code}/${input.storageLocation.code} 仅有 ${stock.qty}，本次出库 ${q}（不允许负库存）`,
      );
    }
    const unitCost = stock.qty > 0 ? money(stock.value / stock.qty) : 0;
    const amount = money(unitCost * q);
    stock.qty = qty(stock.qty - q);
    stock.value = money(stock.value - amount);
    if (stock.qty <= 0.0001) {
      stock.qty = 0;
      stock.value = 0;
    }
    await em.save(stock);
    await em.save(
      em.create(StockMovement, {
        material: input.material,
        plant: input.plant,
        storageLocation: input.storageLocation,
        qty: -q,
        unitCost,
        amount: -amount,
        movementType: input.movementType,
        movementName: input.movementName,
        refType: input.refType,
        refNumber: input.refNumber,
      }),
    );
    return { unitCost, amount, qty: q };
  }

  private async findOrCreate(em: EntityManager, input: MovementInput) {
    let stock = await em.findOne(Stock, {
      where: {
        material: { id: input.material.id },
        plant: { id: input.plant.id },
        storageLocation: { id: input.storageLocation.id },
      },
    });
    if (!stock) {
      stock = em.create(Stock, {
        material: input.material,
        plant: input.plant,
        storageLocation: input.storageLocation,
        qty: 0,
        value: 0,
      });
      await em.save(stock);
    }
    return stock;
  }
}
