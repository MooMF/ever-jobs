import { Module } from '@nestjs/common';
import { SymphonyService } from './symphony.service';

@Module({ providers: [SymphonyService], exports: [SymphonyService] })
export class SymphonyModule {}
