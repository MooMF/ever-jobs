import { Module } from '@nestjs/common';
import { AmountService } from './amount.service';

@Module({ providers: [AmountService], exports: [AmountService] })
export class AmountModule {}
