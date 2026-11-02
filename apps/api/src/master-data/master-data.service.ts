import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Company,
  Customer,
  Material,
  Plant,
  StorageLocation,
  Vendor,
} from './master.entities';
import { CreateMaterialDto, CreatePartnerDto } from './master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(Company) private companies: Repository<Company>,
    @InjectRepository(Plant) private plants: Repository<Plant>,
    @InjectRepository(StorageLocation)
    private slocs: Repository<StorageLocation>,
    @InjectRepository(Material) private materialRepo: Repository<Material>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Vendor) private vendorRepo: Repository<Vendor>,
  ) {}

  async org() {
    const companies = await this.companies.find({
      relations: ['plants', 'plants.storageLocations'],
      order: { code: 'ASC' },
    });
    return { companies };
  }

  materials() {
    return this.materialRepo.find({ order: { code: 'ASC' } });
  }

  async createMaterial(dto: CreateMaterialDto) {
    return this.materialRepo.save(
      this.materialRepo.create({
        code: dto.code,
        name: dto.name,
        unit: dto.unit ?? 'EA',
        standardPrice: dto.standardPrice ?? 0,
        category: dto.category ?? '成品',
      }),
    );
  }

  customers() {
    return this.customerRepo.find({ order: { code: 'ASC' } });
  }

  createCustomer(dto: CreatePartnerDto) {
    return this.customerRepo.save(this.customerRepo.create(dto));
  }

  vendors() {
    return this.vendorRepo.find({ order: { code: 'ASC' } });
  }

  createVendor(dto: CreatePartnerDto) {
    return this.vendorRepo.save(this.vendorRepo.create(dto));
  }

  async getMaterial(id: number) {
    const row = await this.materialRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('物料不存在');
    return row;
  }

  async getPlant(id: number) {
    const row = await this.plants.findOne({ where: { id } });
    if (!row) throw new NotFoundException('工厂不存在');
    return row;
  }

  async getSloc(id: number) {
    const row = await this.slocs.findOne({ where: { id } });
    if (!row) throw new NotFoundException('库存地点不存在');
    return row;
  }

  async getCustomer(id: number) {
    const row = await this.customerRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('客户不存在');
    return row;
  }

  async getVendor(id: number) {
    const row = await this.vendorRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('供应商不存在');
    return row;
  }
}
