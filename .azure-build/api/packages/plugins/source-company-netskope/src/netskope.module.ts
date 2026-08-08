import { Module } from '@nestjs/common';
import { NetskopeService } from './netskope.service';

@Module({ providers: [NetskopeService], exports: [NetskopeService] })
export class NetskopeModule {}
