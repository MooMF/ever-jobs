import { Module } from '@nestjs/common';
import { OpendoorService } from './opendoor.service';

@Module({ providers: [OpendoorService], exports: [OpendoorService] })
export class OpendoorModule {}
