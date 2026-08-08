import { Module } from '@nestjs/common';
import { DescriptService } from './descript.service';

@Module({ providers: [DescriptService], exports: [DescriptService] })
export class DescriptModule {}
