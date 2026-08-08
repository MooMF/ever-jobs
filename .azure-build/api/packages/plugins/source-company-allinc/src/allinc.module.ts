import { Module } from '@nestjs/common';
import { AllincService } from './allinc.service';

@Module({ providers: [AllincService], exports: [AllincService] })
export class AllincModule {}
