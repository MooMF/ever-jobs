import { Module } from '@nestjs/common';
import { PerpayService } from './perpay.service';

@Module({ providers: [PerpayService], exports: [PerpayService] })
export class PerpayModule {}
