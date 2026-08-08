import { Module } from '@nestjs/common';
import { PhonepeService } from './phonepe.service';

@Module({ providers: [PhonepeService], exports: [PhonepeService] })
export class PhonepeModule {}
