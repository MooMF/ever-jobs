import { Module } from '@nestjs/common';
import { BrexService } from './brex.service';

@Module({ providers: [BrexService], exports: [BrexService] })
export class BrexModule {}
