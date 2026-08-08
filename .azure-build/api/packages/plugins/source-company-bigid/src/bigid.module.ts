import { Module } from '@nestjs/common';
import { BigIdService } from './bigid.service';

@Module({ providers: [BigIdService], exports: [BigIdService] })
export class BigIdModule {}
