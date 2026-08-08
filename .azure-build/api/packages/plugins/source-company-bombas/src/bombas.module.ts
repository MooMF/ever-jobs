import { Module } from '@nestjs/common';
import { BombasService } from './bombas.service';

@Module({ providers: [BombasService], exports: [BombasService] })
export class BombasModule {}
