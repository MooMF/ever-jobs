import { Module } from '@nestjs/common';
import { MercariService } from './mercari.service';

@Module({ providers: [MercariService], exports: [MercariService] })
export class MercariModule {}
