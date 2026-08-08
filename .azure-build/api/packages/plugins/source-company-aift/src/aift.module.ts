import { Module } from '@nestjs/common';
import { AiftService } from './aift.service';

@Module({ providers: [AiftService], exports: [AiftService] })
export class AiftModule {}
