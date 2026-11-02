import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

@Entity('gl_accounts')
export class GlAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  type: AccountType;
}

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column()
  description: string;

  @Column()
  sourceType: string;

  @Column()
  sourceNumber: string;

  @Column({ type: 'int', nullable: true })
  sourceId: number | null;

  @OneToMany(() => JournalLine, (l) => l.entry, { cascade: true, eager: true })
  lines: JournalLine[];

  @CreateDateColumn()
  postingDate: Date;
}

@Entity('journal_lines')
export class JournalLine {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => JournalEntry, (e) => e.lines, { onDelete: 'CASCADE' })
  entry: JournalEntry;

  @ManyToOne(() => GlAccount, { eager: true })
  account: GlAccount;

  @Column('real', { default: 0 })
  debit: number;

  @Column('real', { default: 0 })
  credit: number;

  @Column({ default: '' })
  text: string;
}
