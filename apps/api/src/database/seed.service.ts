import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GlAccount } from '../fi/fi.entities';
import {
  Company,
  Customer,
  Material,
  Plant,
  StorageLocation,
  Vendor,
} from '../master-data/master.entities';
import { PurchaseOrderItem } from '../mm/mm.entities';
import { MmService } from '../mm/mm.service';
import { SdService } from '../sd/sd.service';

@Injectable()
export class SeedService {
  private readonly log = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mm: MmService,
    private readonly sd: SdService,
    @InjectRepository(Company) private companies: Repository<Company>,
    @InjectRepository(GlAccount) private accounts: Repository<GlAccount>,
  ) {}

  async ensureSeeded() {
    const count = await this.companies.count();
    if (count > 0) {
      this.log.log('数据库已有主数据，跳过初始化。可用 npm run seed 重置演示数据。');
      return;
    }
    await this.resetAndSeed();
  }

  async resetAndSeed() {
    this.log.log('正在写入教学演示数据…');
    await this.dataSource.dropDatabase();
    await this.dataSource.synchronize();
    const ctx = await this.seedMaster();
    await this.seedHappyPath(ctx);
    this.log.log('演示数据就绪：PR-0001 → PO-0001 → GR-0001 → VI-0001；SO-0001 → DN-0001 → BI-0001');
  }

  private async seedMaster() {
    const company = await this.companies.save(
      this.companies.create({ code: '1000', name: '教学演示公司' }),
    );
    const plantRepo = this.dataSource.getRepository(Plant);
    const slocRepo = this.dataSource.getRepository(StorageLocation);
    const plant = await plantRepo.save(
      plantRepo.create({ code: '1000', name: '上海工厂', company }),
    );
    const raw = await slocRepo.save(
      slocRepo.create({ code: '0001', name: '原料仓', plant }),
    );
    const fg = await slocRepo.save(
      slocRepo.create({ code: '0002', name: '成品仓', plant }),
    );

    const materialRepo = this.dataSource.getRepository(Material);
    const laptop = await materialRepo.save(
      materialRepo.create({
        code: 'MAT-1001',
        name: '笔记本电脑',
        unit: 'EA',
        standardPrice: 5000,
        category: '成品',
      }),
    );
    await materialRepo.save(
      materialRepo.create({
        code: 'MAT-1002',
        name: '显示器',
        unit: 'EA',
        standardPrice: 1200,
        category: '成品',
      }),
    );
    await materialRepo.save(
      materialRepo.create({
        code: 'MAT-2001',
        name: '无线键盘',
        unit: 'EA',
        standardPrice: 180,
        category: '配件',
      }),
    );

    const vendorRepo = this.dataSource.getRepository(Vendor);
    const vendor = await vendorRepo.save(
      vendorRepo.create({
        code: 'V-1000',
        name: '环球电子供应',
        city: '深圳',
      }),
    );
    await vendorRepo.save(
      vendorRepo.create({ code: 'V-2000', name: '迅达工业', city: '苏州' }),
    );

    const customerRepo = this.dataSource.getRepository(Customer);
    const customer = await customerRepo.save(
      customerRepo.create({
        code: 'C-1000',
        name: '华东数码商贸',
        city: '上海',
      }),
    );
    await customerRepo.save(
      customerRepo.create({
        code: 'C-2000',
        name: '南方办公科技',
        city: '广州',
      }),
    );

    await this.accounts.save([
      this.accounts.create({
        code: '1122',
        name: '应收账款',
        type: 'ASSET',
      }),
      this.accounts.create({
        code: '1401',
        name: '库存商品',
        type: 'ASSET',
      }),
      this.accounts.create({
        code: '2202',
        name: '应付账款',
        type: 'LIABILITY',
      }),
      this.accounts.create({
        code: '2203',
        name: '应付暂估 (GR/IR)',
        type: 'LIABILITY',
      }),
      this.accounts.create({
        code: '6001',
        name: '主营业务收入',
        type: 'REVENUE',
      }),
      this.accounts.create({
        code: '6401',
        name: '主营业务成本',
        type: 'EXPENSE',
      }),
    ]);

    return { plant, fg, raw, laptop, vendor, customer };
  }

  private async seedHappyPath(ctx: {
    plant: Plant;
    fg: StorageLocation;
    laptop: Material;
    vendor: Vendor;
    customer: Customer;
  }) {
    const pr = await this.mm.createPr({
      requester: '张学员',
      remark: '演示：补货 10 台笔记本',
      items: [
        { materialId: ctx.laptop.id, plantId: ctx.plant.id, qty: 10 },
      ],
    });
    await this.mm.releasePr(pr.id);
    const po = await this.mm.convertPr(pr.id, {
      vendorId: ctx.vendor.id,
      storageLocationId: ctx.fg.id,
    });
    // convert 使用标准价 5000；教学演示改成采购价 4800，便于观察进销差价
    po.items[0].unitPrice = 4800;
    await this.dataSource.getRepository(PurchaseOrderItem).save(po.items[0]);

    await this.mm.postGr({
      poId: po.id,
      items: [{ poItemId: po.items[0].id, qty: 10 }],
    });
    await this.mm.postInvoice({
      poId: po.id,
      items: [{ poItemId: po.items[0].id, qty: 10 }],
    });

    const so = await this.sd.createSo({
      customerId: ctx.customer.id,
      remark: '演示：华东数码采购 3 台笔记本',
      items: [
        {
          materialId: ctx.laptop.id,
          plantId: ctx.plant.id,
          storageLocationId: ctx.fg.id,
          qty: 3,
          unitPrice: 5999,
        },
      ],
    });
    await this.sd.postDelivery({
      soId: so.id,
      items: [{ soItemId: so.items[0].id, qty: 3 }],
    });
    await this.sd.postBilling({
      soId: so.id,
      items: [{ soItemId: so.items[0].id, qty: 3 }],
    });
  }
}
