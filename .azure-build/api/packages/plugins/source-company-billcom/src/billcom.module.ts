import { Module } from '@nestjs/common';
import { BillcomService } from './billcom.service';

@Module({ providers: [BillcomService], exports: [BillcomService] })
export class BillcomModule {}
