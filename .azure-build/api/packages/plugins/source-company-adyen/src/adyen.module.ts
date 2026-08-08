import { Module } from '@nestjs/common';
import { AdyenService } from './adyen.service';

@Module({ providers: [AdyenService], exports: [AdyenService] })
export class AdyenModule {}
