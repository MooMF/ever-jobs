import { Module } from '@nestjs/common';
import { HeadwayService } from './headway.service';

@Module({ providers: [HeadwayService], exports: [HeadwayService] })
export class HeadwayModule {}
