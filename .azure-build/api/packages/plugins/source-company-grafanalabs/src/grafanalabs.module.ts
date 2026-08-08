import { Module } from '@nestjs/common';
import { GrafanalabsService } from './grafanalabs.service';

@Module({ providers: [GrafanalabsService], exports: [GrafanalabsService] })
export class GrafanalabsModule {}
