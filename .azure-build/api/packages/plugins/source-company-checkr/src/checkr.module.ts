import { Module } from '@nestjs/common';
import { CheckrService } from './checkr.service';

@Module({ providers: [CheckrService], exports: [CheckrService] })
export class CheckrModule {}
