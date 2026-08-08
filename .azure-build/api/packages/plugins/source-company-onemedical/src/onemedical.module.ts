import { Module } from '@nestjs/common';
import { OnemedicalService } from './onemedical.service';

@Module({ providers: [OnemedicalService], exports: [OnemedicalService] })
export class OnemedicalModule {}
