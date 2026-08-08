import { Module } from '@nestjs/common';
import { IntercomService } from './intercom.service';

@Module({ providers: [IntercomService], exports: [IntercomService] })
export class IntercomModule {}
