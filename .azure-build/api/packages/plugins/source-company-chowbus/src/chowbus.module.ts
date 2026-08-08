import { Module } from '@nestjs/common';
import { ChowbusService } from './chowbus.service';

@Module({ providers: [ChowbusService], exports: [ChowbusService] })
export class ChowbusModule {}
