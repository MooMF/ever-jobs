import { Module } from '@nestjs/common';
import { UberService } from './uber.service';

@Module({ providers: [UberService], exports: [UberService] })
export class UberModule {}
