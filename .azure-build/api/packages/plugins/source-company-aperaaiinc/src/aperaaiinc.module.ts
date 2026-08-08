import { Module } from '@nestjs/common';
import { AperaaiincService } from './aperaaiinc.service';

@Module({ providers: [AperaaiincService], exports: [AperaaiincService] })
export class AperaaiincModule {}
