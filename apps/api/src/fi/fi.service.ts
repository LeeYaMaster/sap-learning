import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DocumentNumberService } from '../common/document-number.service';
import { money, nearlyEqual } from '../common/money';
import { GlAccount, JournalEntry, JournalLine } from './fi.entities';

export interface FiLineInput {
  accountCode: string;
  debit?: number;
  credit?: number;
  text?: string;
}

@Injectable()
export class FiService {
  constructor(
    @InjectRepository(GlAccount) private accounts: Repository<GlAccount>,
    @InjectRepository(JournalEntry) private journals: Repository<JournalEntry>,
    private readonly docNumbers: DocumentNumberService,
  ) {}

  listAccounts() {
    return this.accounts.find({ order: { code: 'ASC' } });
  }

  listJournals() {
    return this.journals.find({ order: { id: 'DESC' } });
  }

  async getJournal(id: number) {
    const row = await this.journals.findOne({ where: { id } });
    if (!row) throw new BadRequestException('会计凭证不存在');
    return row;
  }

  async trialBalance() {
    const accounts = await this.accounts.find({ order: { code: 'ASC' } });
    const lines = await this.journals.manager.find(JournalLine, {
      relations: ['account'],
    });
    return accounts.map((acc) => {
      const mine = lines.filter((l) => l.account.id === acc.id);
      const debit = money(mine.reduce((s, l) => s + Number(l.debit), 0));
      const credit = money(mine.reduce((s, l) => s + Number(l.credit), 0));
      const raw = money(debit - credit);
      return {
        account: acc,
        debit,
        credit,
        balance: Math.abs(raw),
        balanceSide: raw > 0.0001 ? '借' : raw < -0.0001 ? '贷' : '平',
      };
    });
  }

  async post(
    em: EntityManager,
    input: {
      description: string;
      sourceType: string;
      sourceNumber: string;
      sourceId?: number;
      lines: FiLineInput[];
    },
  ) {
    const lines = input.lines.map((l) => ({
      ...l,
      debit: money(l.debit ?? 0),
      credit: money(l.credit ?? 0),
    }));
    const debit = money(lines.reduce((s, l) => s + l.debit, 0));
    const credit = money(lines.reduce((s, l) => s + l.credit, 0));
    if (!nearlyEqual(debit, credit)) {
      throw new BadRequestException(
        `借贷不平衡：借 ${debit} / 贷 ${credit}。教学系统要求每张凭证必须借贷相等。`,
      );
    }
    const accounts = await em.find(GlAccount);
    const byCode = new Map(accounts.map((a) => [a.code, a]));
    const docNumber = await this.docNumbers.next(em, 'FI');
    const entry = em.create(JournalEntry, {
      docNumber,
      description: input.description,
      sourceType: input.sourceType,
      sourceNumber: input.sourceNumber,
      sourceId: input.sourceId ?? null,
      lines: lines.map((l) => {
        const account = byCode.get(l.accountCode);
        if (!account) {
          throw new BadRequestException(`科目 ${l.accountCode} 不存在`);
        }
        return em.create(JournalLine, {
          account,
          debit: l.debit,
          credit: l.credit,
          text: l.text ?? '',
        });
      }),
    });
    return em.save(entry);
  }
}
