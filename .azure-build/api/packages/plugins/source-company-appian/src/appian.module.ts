import { Module } from '@nestjs/common';
import { AppianService } from './appian.service';

@Module({ providers: [AppianService], exports: [AppianService] })
export class AppianModule {}
