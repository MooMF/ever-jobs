import { Module } from '@nestjs/common';
import { AmarokService } from './amarok.service';

@Module({ providers: [AmarokService], exports: [AmarokService] })
export class AmarokModule {}
