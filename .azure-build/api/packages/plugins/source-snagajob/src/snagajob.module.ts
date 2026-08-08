import { Module } from '@nestjs/common';
import { SnagajobService } from './snagajob.service';

@Module({ providers: [SnagajobService], exports: [SnagajobService] })
export class SnagajobModule {}
