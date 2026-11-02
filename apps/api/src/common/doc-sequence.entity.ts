import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('doc_sequences')
export class DocSequence {
  @PrimaryColumn()
  prefix: string;

  @Column({ type: 'int', default: 1 })
  nextNumber: number;
}
