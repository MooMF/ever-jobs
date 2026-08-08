import { Module } from '@nestjs/common';
import { RoofstockService } from './roofstock.service';

@Module({ providers: [RoofstockService], exports: [RoofstockService] })
export class RoofstockModule {}
