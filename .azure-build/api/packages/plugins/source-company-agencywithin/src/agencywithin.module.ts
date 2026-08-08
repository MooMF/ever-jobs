import { Module } from '@nestjs/common';
import { AgencywithinService } from './agencywithin.service';

@Module({ providers: [AgencywithinService], exports: [AgencywithinService] })
export class AgencywithinModule {}
