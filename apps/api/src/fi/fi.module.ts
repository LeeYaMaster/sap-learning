import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocSequence } from '../common/doc-sequence.entity';
import { DocumentNumberService } from '../common/document-number.service';
import { GlAccount, JournalEntry, JournalLine } from './fi.entities';
import { FiController } from './fi.controller';
import { FiService } from './fi.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GlAccount, JournalEntry, JournalLine, DocSequence]),
  ],
  controllers: [FiController],
  providers: [FiService, DocumentNumberService],
  exports: [FiService, DocumentNumberService, TypeOrmModule],
})
export class FiModule {}
