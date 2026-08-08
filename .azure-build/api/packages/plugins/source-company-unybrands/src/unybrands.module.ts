import { Module } from '@nestjs/common';
import { UnybrandsService } from './unybrands.service';

@Module({ providers: [UnybrandsService], exports: [UnybrandsService] })
export class UnybrandsModule {}
