import { Module } from '@nestjs/common';
import { AmaehealthService } from './amaehealth.service';

@Module({ providers: [AmaehealthService], exports: [AmaehealthService] })
export class AmaehealthModule {}
