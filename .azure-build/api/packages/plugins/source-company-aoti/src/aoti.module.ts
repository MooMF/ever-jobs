import { Module } from '@nestjs/common';
import { AotiService } from './aoti.service';

@Module({ providers: [AotiService], exports: [AotiService] })
export class AotiModule {}
