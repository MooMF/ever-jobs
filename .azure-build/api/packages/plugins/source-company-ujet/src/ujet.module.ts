import { Module } from '@nestjs/common';
import { UjetService } from './ujet.service';

@Module({ providers: [UjetService], exports: [UjetService] })
export class UjetModule {}
