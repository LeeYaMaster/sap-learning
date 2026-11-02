import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry } from '../fi/fi.entities';
import { Stock } from '../inventory/inventory.entities';
import {
  GoodsReceipt,
  PurchaseOrder,
  PurchaseRequisition,
  VendorInvoice,
} from '../mm/mm.entities';
import { CustomerBilling, Delivery, SalesOrder } from '../sd/sd.entities';

@Injectable()
export class ProcessService {
  constructor(
    @InjectRepository(PurchaseRequisition)
    private prs: Repository<PurchaseRequisition>,
    @InjectRepository(PurchaseOrder) private pos: Repository<PurchaseOrder>,
    @InjectRepository(GoodsReceipt) private grs: Repository<GoodsReceipt>,
    @InjectRepository(VendorInvoice) private invoices: Repository<VendorInvoice>,
    @InjectRepository(SalesOrder) private sos: Repository<SalesOrder>,
    @InjectRepository(Delivery) private deliveries: Repository<Delivery>,
    @InjectRepository(CustomerBilling)
    private billings: Repository<CustomerBilling>,
    @InjectRepository(JournalEntry) private journals: Repository<JournalEntry>,
    @InjectRepository(Stock) private stocks: Repository<Stock>,
  ) {}

  async overview() {
    const [pr, po, gr, vi, so, dn, bi, fi] = await Promise.all([
      this.prs.count(),
      this.pos.count(),
      this.grs.count(),
      this.invoices.count(),
      this.sos.count(),
      this.deliveries.count(),
      this.billings.count(),
      this.journals.count(),
    ]);
    const stocks = await this.stocks.find();
    const stockQty = stocks.reduce((s, r) => s + Number(r.qty), 0);
    const stockValue = stocks.reduce((s, r) => s + Number(r.value), 0);
    const latest = async <T extends { createdAt?: Date; postingDate?: Date }>(
      repo: Repository<T>,
    ) => repo.find({ order: { id: 'DESC' } as never, take: 3 });

    return {
      counts: { pr, po, gr, vi, so, dn, bi, fi },
      stockQty,
      stockValue,
      steps: [
        {
          key: 'master',
          title: '维护主数据',
          tcode: 'MM01 / XK01 / VD01',
          path: '/master/materials',
          done: true,
          blurb: '物料、客户、供应商、公司/工厂/库存地点是所有单据的基础。',
        },
        {
          key: 'pr',
          title: '采购申请 PR',
          tcode: 'ME51N',
          path: '/mm/pr',
          done: pr > 0,
          blurb: '内部提出需求，释放后才能转成采购订单。',
        },
        {
          key: 'po',
          title: '采购订单 PO',
          tcode: 'ME21N',
          path: '/mm/po',
          done: po > 0,
          blurb: '对供应商的采购承诺，后续收货与发票都对照它。',
        },
        {
          key: 'gr',
          title: '收货入库 GR',
          tcode: 'MIGO',
          path: '/mm/gr',
          done: gr > 0,
          blurb: '库存增加，财务借库存、贷 GR/IR 暂估。',
        },
        {
          key: 'vi',
          title: '供应商发票 VI',
          tcode: 'MIRO',
          path: '/mm/invoices',
          done: vi > 0,
          blurb: '三单匹配后确认应付账款。',
        },
        {
          key: 'so',
          title: '销售订单 SO',
          tcode: 'VA01',
          path: '/sd/so',
          done: so > 0,
          blurb: '客户要货，后续发货与开票都对照它。',
        },
        {
          key: 'dn',
          title: '发货出库 DN',
          tcode: 'VL01N',
          path: '/sd/deliveries',
          done: dn > 0,
          blurb: '扣库存并结转销售成本，不允许负库存。',
        },
        {
          key: 'bi',
          title: '客户开票 BI',
          tcode: 'VF01',
          path: '/sd/billings',
          done: bi > 0,
          blurb: '确认应收账款与销售收入。',
        },
        {
          key: 'fi',
          title: '查看库存与财务',
          tcode: 'MMBE / FB03',
          path: '/fi/trial-balance',
          done: fi > 0,
          blurb: '每张物流单据都会自动生成借贷平衡的会计凭证。',
        },
      ],
      recent: {
        pr: await latest(this.prs),
        po: await latest(this.pos),
        so: await latest(this.sos),
      },
    };
  }

  async flow(type: string, id: number) {
    const t = type.toUpperCase();
    if (t === 'PR') {
      const pr = await this.prs.findOne({ where: { id } });
      if (!pr) throw new NotFoundException('单据不存在');
      const pos = await this.pos.find({ where: { pr: { id } } });
      return this.buildFlowFromPos(pr, pos);
    }
    if (t === 'PO') {
      const po = await this.pos.findOne({ where: { id } });
      if (!po) throw new NotFoundException('单据不存在');
      return this.buildFlowFromPos(po.pr, [po]);
    }
    if (t === 'GR') {
      const gr = await this.grs.findOne({ where: { id } });
      if (!gr) throw new NotFoundException('单据不存在');
      return this.buildFlowFromPos(gr.po.pr, [gr.po]);
    }
    if (t === 'VI') {
      const vi = await this.invoices.findOne({ where: { id } });
      if (!vi) throw new NotFoundException('单据不存在');
      return this.buildFlowFromPos(vi.po.pr, [vi.po]);
    }
    if (t === 'SO') {
      const so = await this.sos.findOne({ where: { id } });
      if (!so) throw new NotFoundException('单据不存在');
      return this.buildFlowFromSo(so);
    }
    if (t === 'DN') {
      const dn = await this.deliveries.findOne({ where: { id } });
      if (!dn) throw new NotFoundException('单据不存在');
      return this.buildFlowFromSo(dn.so);
    }
    if (t === 'BI') {
      const bi = await this.billings.findOne({ where: { id } });
      if (!bi) throw new NotFoundException('单据不存在');
      return this.buildFlowFromSo(bi.so);
    }
    throw new NotFoundException('不支持的单据类型');
  }

  private async buildFlowFromPos(
    pr: PurchaseRequisition | null,
    pos: PurchaseOrder[],
  ) {
    const nodes: { type: string; id: number; docNumber: string; status: string }[] =
      [];
    if (pr) {
      nodes.push({
        type: 'PR',
        id: pr.id,
        docNumber: pr.docNumber,
        status: pr.status,
      });
    }
    for (const po of pos) {
      nodes.push({
        type: 'PO',
        id: po.id,
        docNumber: po.docNumber,
        status: po.status,
      });
      const grs = await this.grs.find({ where: { po: { id: po.id } } });
      const vis = await this.invoices.find({ where: { po: { id: po.id } } });
      for (const g of grs) {
        nodes.push({
          type: 'GR',
          id: g.id,
          docNumber: g.docNumber,
          status: g.status,
        });
      }
      for (const v of vis) {
        nodes.push({
          type: 'VI',
          id: v.id,
          docNumber: v.docNumber,
          status: v.status,
        });
      }
    }
    return { process: 'P2P', nodes };
  }

  private async buildFlowFromSo(so: SalesOrder) {
    const nodes: { type: string; id: number; docNumber: string; status: string }[] =
      [{ type: 'SO', id: so.id, docNumber: so.docNumber, status: so.status }];
    const dns = await this.deliveries.find({ where: { so: { id: so.id } } });
    const bis = await this.billings.find({ where: { so: { id: so.id } } });
    for (const d of dns) {
      nodes.push({
        type: 'DN',
        id: d.id,
        docNumber: d.docNumber,
        status: d.status,
      });
    }
    for (const b of bis) {
      nodes.push({
        type: 'BI',
        id: b.id,
        docNumber: b.docNumber,
        status: b.status,
      });
    }
    return { process: 'O2C', nodes };
  }
}
