import { Module } from '@nestjs/common';
import { AlloyService } from './alloy.service';

@Module({ providers: [AlloyService], exports: [AlloyService] })
export class AlloyModule {}
