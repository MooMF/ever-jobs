import { Module } from '@nestjs/common';
import { TwoChairsService } from './twochairs.service';

@Module({ providers: [TwoChairsService], exports: [TwoChairsService] })
export class TwoChairsModule {}
