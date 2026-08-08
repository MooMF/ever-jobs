import { Module } from '@nestjs/common';
import { HuntressService } from './huntress.service';

@Module({ providers: [HuntressService], exports: [HuntressService] })
export class HuntressModule {}
