import { Module } from '@nestjs/common';
import { LithicService } from './lithic.service';

@Module({ providers: [LithicService], exports: [LithicService] })
export class LithicModule {}
