import { Module } from '@nestjs/common';
import { FairmarkitService } from './fairmarkit.service';

@Module({ providers: [FairmarkitService], exports: [FairmarkitService] })
export class FairmarkitModule {}
