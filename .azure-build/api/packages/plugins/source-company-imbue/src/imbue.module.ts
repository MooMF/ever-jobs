import { Module } from '@nestjs/common';
import { ImbueService } from './imbue.service';

@Module({ providers: [ImbueService], exports: [ImbueService] })
export class ImbueModule {}
