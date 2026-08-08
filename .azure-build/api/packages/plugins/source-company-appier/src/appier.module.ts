import { Module } from '@nestjs/common';
import { AppierService } from './appier.service';

@Module({ providers: [AppierService], exports: [AppierService] })
export class AppierModule {}
