import { Module } from '@nestjs/common';
import { BloomreachService } from './bloomreach.service';

@Module({ providers: [BloomreachService], exports: [BloomreachService] })
export class BloomreachModule {}
