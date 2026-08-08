import { Module } from '@nestjs/common';
import { ApexcompaniesService } from './apexcompanies.service';

@Module({ providers: [ApexcompaniesService], exports: [ApexcompaniesService] })
export class ApexcompaniesModule {}
