import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DocumentNumberService } from '../common/document-number.service';
import { money, qty } from '../common/money';
import { FiService } from '../fi/fi.service';
import { InventoryService } from '../inventory/inventory.service';
import { MasterDataService } from '../master-data/master-data.service';
import { CreateSoDto, PostBillingDto, PostDeliveryDto } from './sd.dto';
import {
  CustomerBilling,
  CustomerBillingItem,
  Delivery,
  DeliveryItem,
  SalesOrder,
  SalesOrderItem,
  SoStatus,
} from './sd.entities';

const SO_TIPS =
  '销售订单（SO）记录客户要货。对应 VA01。发货数量不能超过订单未清数量，且库存不能为负。';
const DN_TIPS =
  '发货过账会扣减库存，并结转销售成本：借 主营业务成本(6401)，贷 库存商品(1401)。对应 VL01N / 移动类型 601。';
const BI_TIPS =
  '客户开票确认收入和应收账款：借 应收账款(1122)，贷 主营业务收入(6001)。对应 VF01。开票数量不能超过已发货数量。';

@Injectable()
export class SdService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly docs: DocumentNumberService,
    private readonly master: MasterDataService,
    private readonly inventory: InventoryService,
    private readonly fi: FiService,
    @InjectRepository(SalesOrder) private sos: Repository<SalesOrder>,
    @InjectRepository(Delivery) private deliveries: Repository<Delivery>,
    @InjectRepository(CustomerBilling)
    private billings: Repository<CustomerBilling>,
  ) {}

  listSo() {
    return this.sos.find({ order: { id: 'DESC' } });
  }

  async getSo(id: number) {
    const so = await this.mustSo(id);
    const deliveries = await this.deliveries.find({ where: { so: { id } } });
    const billings = await this.billings.find({ where: { so: { id } } });
    return {
      ...this.decorateSo(so),
      deliveries: deliveries.map((d) => ({
        id: d.id,
        docNumber: d.docNumber,
        status: d.status,
        postingDate: d.postingDate,
      })),
      billings: billings.map((b) => ({
        id: b.id,
        docNumber: b.docNumber,
        status: b.status,
        amount: b.amount,
        postingDate: b.postingDate,
      })),
      tips: SO_TIPS,
      nextActions: this.soActions(so),
    };
  }

  async createSo(dto: CreateSoDto) {
    const customer = await this.master.getCustomer(dto.customerId);
    return this.dataSource.transaction(async (em) => {
      const items: SalesOrderItem[] = [];
      let line = 10;
      for (const it of dto.items) {
        const material = await this.master.getMaterial(it.materialId);
        const plant = await this.master.getPlant(it.plantId);
        const sloc = await this.master.getSloc(it.storageLocationId);
        if (sloc.plant.id !== plant.id) {
          throw new BadRequestException('库存地点不属于所选工厂');
        }
        items.push(
          em.create(SalesOrderItem, {
            lineNumber: line,
            material,
            plant,
            storageLocation: sloc,
            qty: qty(it.qty),
            unitPrice: money(it.unitPrice),
            deliveredQty: 0,
            billedQty: 0,
          }),
        );
        line += 10;
      }
      const so = em.create(SalesOrder, {
        docNumber: await this.docs.next(em, 'SO'),
        status: 'OPEN',
        customer,
        remark: dto.remark || '',
        items,
      });
      return em.save(so);
    });
  }

  listDeliveries() {
    return this.deliveries.find({ order: { id: 'DESC' } });
  }

  async getDelivery(id: number) {
    const dn = await this.deliveries.findOne({ where: { id } });
    if (!dn) throw new NotFoundException('交货单不存在');
    return { ...dn, tips: DN_TIPS };
  }

  async postDelivery(dto: PostDeliveryDto) {
    return this.dataSource.transaction(async (em) => {
      const so = await em.findOne(SalesOrder, {
        where: { id: dto.soId },
        relations: ['items', 'customer'],
      });
      if (!so) throw new NotFoundException('销售订单不存在');
      const dnItems: DeliveryItem[] = [];
      let cogs = 0;
      const docNumber = await this.docs.next(em, 'DN');
      for (const line of dto.items) {
        const soItem = so.items.find((i) => i.id === line.soItemId);
        if (!soItem) throw new BadRequestException('销售订单行不存在');
        const deliverQty = qty(line.qty);
        const open = qty(soItem.qty - soItem.deliveredQty);
        if (deliverQty > open + 1e-9) {
          throw new BadRequestException(
            `不能超发：行 ${soItem.lineNumber} 未清数量 ${open}，本次发货 ${deliverQty}`,
          );
        }
        const issued = await this.inventory.issue(em, {
          material: soItem.material,
          plant: soItem.plant,
          storageLocation: soItem.storageLocation,
          qty: deliverQty,
          movementType: '601',
          movementName: '销售发货出库',
          refType: 'DN',
          refNumber: docNumber,
        });
        soItem.deliveredQty = qty(soItem.deliveredQty + deliverQty);
        await em.save(soItem);
        cogs = money(cogs + issued.amount);
        dnItems.push(
          em.create(DeliveryItem, {
            soItem,
            material: soItem.material,
            plant: soItem.plant,
            storageLocation: soItem.storageLocation,
            qty: deliverQty,
            unitCost: issued.unitCost,
          }),
        );
      }
      const delivery = await em.save(
        em.create(Delivery, {
          docNumber,
          status: 'POSTED',
          so,
          items: dnItems,
          cogsAmount: cogs,
        }),
      );
      await this.fi.post(em, {
        description: `销售发货 ${docNumber} / ${so.docNumber}`,
        sourceType: 'DN',
        sourceNumber: docNumber,
        sourceId: delivery.id,
        lines: [
          {
            accountCode: '6401',
            debit: cogs,
            text: '结转销售成本',
          },
          {
            accountCode: '1401',
            credit: cogs,
            text: '库存减少',
          },
        ],
      });
      so.status = this.computeSoStatus(so.items);
      await em.save(so);
      return delivery;
    });
  }

  listBillings() {
    return this.billings.find({ order: { id: 'DESC' } });
  }

  async getBilling(id: number) {
    const bi = await this.billings.findOne({ where: { id } });
    if (!bi) throw new NotFoundException('客户发票不存在');
    return { ...bi, tips: BI_TIPS };
  }

  async postBilling(dto: PostBillingDto) {
    return this.dataSource.transaction(async (em) => {
      const so = await em.findOne(SalesOrder, {
        where: { id: dto.soId },
        relations: ['items', 'customer'],
      });
      if (!so) throw new NotFoundException('销售订单不存在');
      const items: CustomerBillingItem[] = [];
      let amount = 0;
      const docNumber = await this.docs.next(em, 'BI');
      for (const line of dto.items) {
        const soItem = so.items.find((i) => i.id === line.soItemId);
        if (!soItem) throw new BadRequestException('销售订单行不存在');
        const billQty = qty(line.qty);
        const billable = qty(soItem.deliveredQty - soItem.billedQty);
        if (billQty > billable + 1e-9) {
          throw new BadRequestException(
            `不能超开票：行 ${soItem.lineNumber} 已发未开票数量 ${billable}，本次开票 ${billQty}。请先发货。`,
          );
        }
        soItem.billedQty = qty(soItem.billedQty + billQty);
        await em.save(soItem);
        const lineAmt = money(billQty * soItem.unitPrice);
        amount = money(amount + lineAmt);
        items.push(
          em.create(CustomerBillingItem, {
            soItem,
            material: soItem.material,
            qty: billQty,
            unitPrice: soItem.unitPrice,
          }),
        );
      }
      const billing = await em.save(
        em.create(CustomerBilling, {
          docNumber,
          status: 'POSTED',
          so,
          customer: so.customer,
          amount,
          items,
        }),
      );
      await this.fi.post(em, {
        description: `客户开票 ${docNumber} / ${so.docNumber}`,
        sourceType: 'BI',
        sourceNumber: docNumber,
        sourceId: billing.id,
        lines: [
          {
            accountCode: '1122',
            debit: amount,
            text: `应收 ${so.customer.name}`,
          },
          {
            accountCode: '6001',
            credit: amount,
            text: '确认销售收入',
          },
        ],
      });
      so.status = this.computeSoStatus(so.items);
      await em.save(so);
      return billing;
    });
  }

  private computeSoStatus(items: SalesOrderItem[]): SoStatus {
    const allDelivered = items.every((i) => i.deliveredQty + 1e-9 >= i.qty);
    const someDelivered = items.some((i) => i.deliveredQty > 1e-9);
    const allBilled = items.every((i) => i.billedQty + 1e-9 >= i.qty);
    if (allDelivered && allBilled) return 'CLOSED';
    if (allDelivered) return 'DELIVERED';
    if (someDelivered) return 'PARTIAL';
    return 'OPEN';
  }

  private decorateSo(so: SalesOrder) {
    return {
      ...so,
      items: so.items.map((i) => ({
        ...i,
        openQty: qty(i.qty - i.deliveredQty),
        unbilledQty: qty(i.deliveredQty - i.billedQty),
      })),
    };
  }

  private soActions(so: SalesOrder) {
    const actions: { action: string; label: string }[] = [];
    if (so.items.some((i) => i.deliveredQty + 1e-9 < i.qty)) {
      actions.push({ action: 'deliver', label: '发货过账 (VL01N)' });
    }
    if (so.items.some((i) => i.billedQty + 1e-9 < i.deliveredQty)) {
      actions.push({ action: 'bill', label: '客户开票 (VF01)' });
    }
    return actions;
  }

  private async mustSo(id: number) {
    const so = await this.sos.findOne({ where: { id } });
    if (!so) throw new NotFoundException('销售订单不存在');
    return so;
  }
}
