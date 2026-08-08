import { Module } from '@nestjs/common';
import { IliaDigitalService } from './ilia.service';

@Module({ providers: [IliaDigitalService], exports: [IliaDigitalService] })
export class IliaDigitalModule {}
