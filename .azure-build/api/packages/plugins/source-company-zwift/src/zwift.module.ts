import { Module } from '@nestjs/common';
import { ZwiftService } from './zwift.service';

@Module({ providers: [ZwiftService], exports: [ZwiftService] })
export class ZwiftModule {}
