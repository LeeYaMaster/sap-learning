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
import {
  ConvertPrDto,
  CreatePoDto,
  CreatePrDto,
  PostGrDto,
  PostInvoiceDto,
} from './mm.dto';
import {
  GoodsReceipt,
  GoodsReceiptItem,
  PoStatus,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  VendorInvoice,
  VendorInvoiceItem,
} from './mm.entities';

const PR_TIPS =
  '采购申请（PR）只是内部需求，还没有对供应商承诺。对应 SAP 事务码 ME51N。先「释放」再「转采购订单」。';
const PO_TIPS =
  '采购订单（PO）是对供应商的承诺。对应 ME21N。收货数量不能超过未清数量；发票数量不能超过已收货数量（三单匹配：PO-GR-Invoice）。';
const GR_TIPS =
  '收货过账后库存增加，并自动生成会计凭证：借 库存商品(1401)，贷 应付暂估 GR/IR(2203)。对应 MIGO / 移动类型 101。';
const VI_TIPS =
  '供应商发票校验把暂估转为真正的应付账款：借 应付暂估(2203)，贷 应付账款(2202)。对应 MIRO。教学版按采购订单价入账。';

@Injectable()
export class MmService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly docs: DocumentNumberService,
    private readonly master: MasterDataService,
    private readonly inventory: InventoryService,
    private readonly fi: FiService,
    @InjectRepository(PurchaseRequisition)
    private prs: Repository<PurchaseRequisition>,
    @InjectRepository(PurchaseOrder) private pos: Repository<PurchaseOrder>,
    @InjectRepository(GoodsReceipt) private grs: Repository<GoodsReceipt>,
    @InjectRepository(VendorInvoice) private invoices: Repository<VendorInvoice>,
  ) {}

  listPr() {
    return this.prs.find({ order: { id: 'DESC' } });
  }

  async getPr(id: number) {
    const pr = await this.prs.findOne({ where: { id } });
    if (!pr) throw new NotFoundException('采购申请不存在');
    const relatedPos = await this.pos.find({ where: { pr: { id } } });
    return {
      ...pr,
      relatedPos,
      tips: PR_TIPS,
      nextActions: this.prActions(pr),
    };
  }

  async createPr(dto: CreatePrDto) {
    return this.dataSource.transaction(async (em) => {
      const items: PurchaseRequisitionItem[] = [];
      let line = 10;
      for (const it of dto.items) {
        const material = await this.master.getMaterial(it.materialId);
        const plant = await this.master.getPlant(it.plantId);
        items.push(
          em.create(PurchaseRequisitionItem, {
            lineNumber: line,
            material,
            plant,
            qty: qty(it.qty),
          }),
        );
        line += 10;
      }
      const pr = em.create(PurchaseRequisition, {
        docNumber: await this.docs.next(em, 'PR'),
        status: 'DRAFT',
        requester: dto.requester || '采购员',
        remark: dto.remark || '',
        items,
      });
      return em.save(pr);
    });
  }

  async releasePr(id: number) {
    const pr = await this.mustPr(id);
    if (pr.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的采购申请可以释放');
    }
    pr.status = 'RELEASED';
    return this.prs.save(pr);
  }

  async convertPr(id: number, dto: ConvertPrDto) {
    const pr = await this.mustPr(id);
    if (pr.status !== 'RELEASED') {
      throw new BadRequestException('请先释放采购申请，再转为采购订单');
    }
    const vendor = await this.master.getVendor(dto.vendorId);
    const sloc = await this.master.getSloc(dto.storageLocationId);
    return this.dataSource.transaction(async (em) => {
      const items = pr.items.map((it, idx) =>
        em.create(PurchaseOrderItem, {
          lineNumber: (idx + 1) * 10,
          material: it.material,
          plant: it.plant,
          storageLocation: sloc,
          qty: it.qty,
          unitPrice: it.material.standardPrice,
          receivedQty: 0,
          invoicedQty: 0,
        }),
      );
      const po = em.create(PurchaseOrder, {
        docNumber: await this.docs.next(em, 'PO'),
        status: 'OPEN',
        vendor,
        pr,
        remark: `由 ${pr.docNumber} 转换`,
        items,
      });
      const saved = await em.save(po);
      pr.status = 'CONVERTED';
      await em.save(pr);
      return saved;
    });
  }

  listPo() {
    return this.pos.find({ order: { id: 'DESC' } });
  }

  async getPo(id: number) {
    const po = await this.mustPo(id);
    const goodsReceipts = await this.grs.find({ where: { po: { id } } });
    const invoices = await this.invoices.find({ where: { po: { id } } });
    return {
      ...this.decoratePo(po),
      goodsReceipts: goodsReceipts.map((g) => ({
        id: g.id,
        docNumber: g.docNumber,
        status: g.status,
        postingDate: g.postingDate,
      })),
      invoices: invoices.map((v) => ({
        id: v.id,
        docNumber: v.docNumber,
        status: v.status,
        amount: v.amount,
        postingDate: v.postingDate,
      })),
      tips: PO_TIPS,
      nextActions: this.poActions(po),
    };
  }

  async createPo(dto: CreatePoDto) {
    const vendor = await this.master.getVendor(dto.vendorId);
    const pr = dto.prId ? await this.mustPr(dto.prId) : null;
    return this.dataSource.transaction(async (em) => {
      const items: PurchaseOrderItem[] = [];
      let line = 10;
      for (const it of dto.items) {
        const material = await this.master.getMaterial(it.materialId);
        const plant = await this.master.getPlant(it.plantId);
        const sloc = await this.master.getSloc(it.storageLocationId);
        if (sloc.plant.id !== plant.id) {
          throw new BadRequestException('库存地点不属于所选工厂');
        }
        items.push(
          em.create(PurchaseOrderItem, {
            lineNumber: line,
            material,
            plant,
            storageLocation: sloc,
            qty: qty(it.qty),
            unitPrice: money(it.unitPrice),
            receivedQty: 0,
            invoicedQty: 0,
          }),
        );
        line += 10;
      }
      const po = em.create(PurchaseOrder, {
        docNumber: await this.docs.next(em, 'PO'),
        status: 'OPEN',
        vendor,
        pr,
        remark: dto.remark || '',
        items,
      });
      const saved = await em.save(po);
      if (pr && pr.status === 'RELEASED') {
        pr.status = 'CONVERTED';
        await em.save(pr);
      }
      return saved;
    });
  }

  listGr() {
    return this.grs.find({ order: { id: 'DESC' } });
  }

  async getGr(id: number) {
    const gr = await this.grs.findOne({ where: { id } });
    if (!gr) throw new NotFoundException('收货单不存在');
    return { ...gr, tips: GR_TIPS };
  }

  async postGr(dto: PostGrDto) {
    return this.dataSource.transaction(async (em) => {
      const po = await em.findOne(PurchaseOrder, {
        where: { id: dto.poId },
        relations: ['items', 'vendor'],
      });
      if (!po) throw new NotFoundException('采购订单不存在');
      if (po.status === 'CLOSED') {
        throw new BadRequestException('采购订单已关闭，不能再收货');
      }
      const grItems: GoodsReceiptItem[] = [];
      let amount = 0;
      const docNumber = await this.docs.next(em, 'GR');
      for (const line of dto.items) {
        const poItem = po.items.find((i) => i.id === line.poItemId);
        if (!poItem) throw new BadRequestException('采购订单行不存在');
        const receiveQty = qty(line.qty);
        const open = qty(poItem.qty - poItem.receivedQty);
        if (receiveQty > open + 1e-9) {
          throw new BadRequestException(
            `不能超收：行 ${poItem.lineNumber} 未清数量 ${open}，本次收货 ${receiveQty}`,
          );
        }
        poItem.receivedQty = qty(poItem.receivedQty + receiveQty);
        await em.save(poItem);
        const posted = await this.inventory.receipt(em, {
          material: poItem.material,
          plant: poItem.plant,
          storageLocation: poItem.storageLocation,
          qty: receiveQty,
          unitCost: poItem.unitPrice,
          movementType: '101',
          movementName: '采购收货入库',
          refType: 'GR',
          refNumber: docNumber,
        });
        amount = money(amount + posted.amount);
        grItems.push(
          em.create(GoodsReceiptItem, {
            poItem,
            material: poItem.material,
            plant: poItem.plant,
            storageLocation: poItem.storageLocation,
            qty: receiveQty,
            unitPrice: poItem.unitPrice,
          }),
        );
      }
      const gr = await em.save(
        em.create(GoodsReceipt, {
          docNumber,
          status: 'POSTED',
          po,
          items: grItems,
        }),
      );
      await this.fi.post(em, {
        description: `采购收货 ${docNumber} / ${po.docNumber}`,
        sourceType: 'GR',
        sourceNumber: docNumber,
        sourceId: gr.id,
        lines: [
          {
            accountCode: '1401',
            debit: amount,
            text: '库存增加',
          },
          {
            accountCode: '2203',
            credit: amount,
            text: 'GR/IR 应付暂估',
          },
        ],
      });
      po.status = this.computePoStatus(po.items);
      await em.save(po);
      return gr;
    });
  }

  listInvoices() {
    return this.invoices.find({ order: { id: 'DESC' } });
  }

  async getInvoice(id: number) {
    const inv = await this.invoices.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('供应商发票不存在');
    return { ...inv, tips: VI_TIPS };
  }

  async postInvoice(dto: PostInvoiceDto) {
    return this.dataSource.transaction(async (em) => {
      const po = await em.findOne(PurchaseOrder, {
        where: { id: dto.poId },
        relations: ['items', 'vendor'],
      });
      if (!po) throw new NotFoundException('采购订单不存在');
      const viItems: VendorInvoiceItem[] = [];
      let amount = 0;
      const docNumber = await this.docs.next(em, 'VI');
      for (const line of dto.items) {
        const poItem = po.items.find((i) => i.id === line.poItemId);
        if (!poItem) throw new BadRequestException('采购订单行不存在');
        const invoiceQty = qty(line.qty);
        const matchable = qty(poItem.receivedQty - poItem.invoicedQty);
        if (invoiceQty > matchable + 1e-9) {
          throw new BadRequestException(
            `三单匹配失败：行 ${poItem.lineNumber} 已收未开票数量 ${matchable}，本次发票 ${invoiceQty}。请先收货再开票。`,
          );
        }
        poItem.invoicedQty = qty(poItem.invoicedQty + invoiceQty);
        await em.save(poItem);
        const lineAmt = money(invoiceQty * poItem.unitPrice);
        amount = money(amount + lineAmt);
        viItems.push(
          em.create(VendorInvoiceItem, {
            poItem,
            material: poItem.material,
            qty: invoiceQty,
            unitPrice: poItem.unitPrice,
          }),
        );
      }
      const invoice = await em.save(
        em.create(VendorInvoice, {
          docNumber,
          status: 'POSTED',
          po,
          vendor: po.vendor,
          amount,
          items: viItems,
        }),
      );
      await this.fi.post(em, {
        description: `供应商发票 ${docNumber} / ${po.docNumber}`,
        sourceType: 'VI',
        sourceNumber: docNumber,
        sourceId: invoice.id,
        lines: [
          {
            accountCode: '2203',
            debit: amount,
            text: '冲销 GR/IR 暂估',
          },
          {
            accountCode: '2202',
            credit: amount,
            text: `应付 ${po.vendor.name}`,
          },
        ],
      });
      po.status = this.computePoStatus(po.items);
      await em.save(po);
      return invoice;
    });
  }

  private computePoStatus(items: PurchaseOrderItem[]): PoStatus {
    const allReceived = items.every((i) => i.receivedQty + 1e-9 >= i.qty);
    const someReceived = items.some((i) => i.receivedQty > 1e-9);
    const allInvoiced = items.every((i) => i.invoicedQty + 1e-9 >= i.qty);
    if (allReceived && allInvoiced) return 'CLOSED';
    if (allReceived) return 'RECEIVED';
    if (someReceived) return 'PARTIAL';
    return 'OPEN';
  }

  private decoratePo(po: PurchaseOrder) {
    return {
      ...po,
      items: po.items.map((i) => ({
        ...i,
        openQty: qty(i.qty - i.receivedQty),
        uninvoicedQty: qty(i.receivedQty - i.invoicedQty),
      })),
    };
  }

  private prActions(pr: PurchaseRequisition) {
    if (pr.status === 'DRAFT') return [{ action: 'release', label: '释放采购申请' }];
    if (pr.status === 'RELEASED')
      return [{ action: 'convert', label: '转为采购订单' }];
    return [];
  }

  private poActions(po: PurchaseOrder) {
    const actions: { action: string; label: string }[] = [];
    if (po.items.some((i) => i.receivedQty + 1e-9 < i.qty)) {
      actions.push({ action: 'gr', label: '收货入库 (MIGO)' });
    }
    if (po.items.some((i) => i.invoicedQty + 1e-9 < i.receivedQty)) {
      actions.push({ action: 'invoice', label: '发票校验 (MIRO)' });
    }
    return actions;
  }

  private async mustPr(id: number) {
    const pr = await this.prs.findOne({ where: { id } });
    if (!pr) throw new NotFoundException('采购申请不存在');
    return pr;
  }

  private async mustPo(id: number) {
    const po = await this.pos.findOne({ where: { id } });
    if (!po) throw new NotFoundException('采购订单不存在');
    return po;
  }
}
