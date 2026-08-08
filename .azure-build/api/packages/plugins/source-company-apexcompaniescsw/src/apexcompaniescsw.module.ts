import { Module } from '@nestjs/common';
import { ApexcompaniescswService } from './apexcompaniescsw.service';

@Module({ providers: [ApexcompaniescswService], exports: [ApexcompaniescswService] })
export class ApexcompaniescswModule {}
