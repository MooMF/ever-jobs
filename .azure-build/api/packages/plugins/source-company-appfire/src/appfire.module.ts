import { Module } from '@nestjs/common';
import { AppfireService } from './appfire.service';

@Module({ providers: [AppfireService], exports: [AppfireService] })
export class AppfireModule {}
