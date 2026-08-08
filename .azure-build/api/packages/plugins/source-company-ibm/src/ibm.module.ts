import { Module } from '@nestjs/common';
import { IbmService } from './ibm.service';

@Module({ providers: [IbmService], exports: [IbmService] })
export class IbmModule {}
