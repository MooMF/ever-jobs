import { Module } from '@nestjs/common';
import { VannevarlabsService } from './vannevarlabs.service';

@Module({ providers: [VannevarlabsService], exports: [VannevarlabsService] })
export class VannevarlabsModule {}
