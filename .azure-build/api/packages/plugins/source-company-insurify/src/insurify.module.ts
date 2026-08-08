import { Module } from '@nestjs/common';
import { InsurifyService } from './insurify.service';

@Module({ providers: [InsurifyService], exports: [InsurifyService] })
export class InsurifyModule {}
