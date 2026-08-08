import { Module } from '@nestjs/common';
import { DeepmindService } from './deepmind.service';

@Module({ providers: [DeepmindService], exports: [DeepmindService] })
export class DeepmindModule {}
