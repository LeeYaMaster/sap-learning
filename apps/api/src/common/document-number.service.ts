import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DocSequence } from './doc-sequence.entity';

@Injectable()
export class DocumentNumberService {
  async next(em: EntityManager, prefix: string): Promise<string> {
    let seq = await em.findOne(DocSequence, { where: { prefix } });
    if (!seq) {
      seq = em.create(DocSequence, { prefix, nextNumber: 1 });
    }
    const current = seq.nextNumber;
    seq.nextNumber = current + 1;
    await em.save(seq);
    return `${prefix}-${String(current).padStart(4, '0')}`;
  }
}
