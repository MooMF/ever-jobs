import { Module } from '@nestjs/common';
import { JustworksService } from './justworks.service';

@Module({ providers: [JustworksService], exports: [JustworksService] })
export class JustworksModule {}
