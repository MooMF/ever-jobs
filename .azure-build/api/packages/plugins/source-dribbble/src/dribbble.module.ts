import { Module } from '@nestjs/common';
import { DribbbleService } from './dribbble.service';

@Module({ providers: [DribbbleService], exports: [DribbbleService] })
export class DribbbleModule {}
