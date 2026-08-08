import { Module } from '@nestjs/common';
import { AmperityService } from './amperity.service';

@Module({ providers: [AmperityService], exports: [AmperityService] })
export class AmperityModule {}
