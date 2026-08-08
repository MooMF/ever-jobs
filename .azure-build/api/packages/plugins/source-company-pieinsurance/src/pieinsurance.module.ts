import { Module } from '@nestjs/common';
import { PieInsuranceService } from './pieinsurance.service';

@Module({ providers: [PieInsuranceService], exports: [PieInsuranceService] })
export class PieInsuranceModule {}
