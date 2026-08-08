import { Module } from '@nestjs/common';
import { GinkgoBioworksService } from './ginkgobioworks.service';

@Module({ providers: [GinkgoBioworksService], exports: [GinkgoBioworksService] })
export class GinkgoBioworksModule {}
