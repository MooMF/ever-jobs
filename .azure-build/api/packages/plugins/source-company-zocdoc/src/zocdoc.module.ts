import { Module } from '@nestjs/common';
import { ZocdocService } from './zocdoc.service';

@Module({ providers: [ZocdocService], exports: [ZocdocService] })
export class ZocdocModule {}
