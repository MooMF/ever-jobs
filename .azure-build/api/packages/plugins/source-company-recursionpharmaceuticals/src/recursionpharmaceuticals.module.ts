import { Module } from '@nestjs/common';
import { RecursionService } from './recursionpharmaceuticals.service';

@Module({ providers: [RecursionService], exports: [RecursionService] })
export class RecursionModule {}
