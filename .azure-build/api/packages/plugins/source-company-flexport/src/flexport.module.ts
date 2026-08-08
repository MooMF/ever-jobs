import { Module } from '@nestjs/common';
import { FlexportService } from './flexport.service';

@Module({ providers: [FlexportService], exports: [FlexportService] })
export class FlexportModule {}
