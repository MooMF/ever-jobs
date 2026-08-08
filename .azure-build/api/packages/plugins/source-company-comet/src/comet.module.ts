import { Module } from '@nestjs/common';
import { CometService } from './comet.service';

@Module({ providers: [CometService], exports: [CometService] })
export class CometModule {}
