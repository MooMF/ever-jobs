import { Module } from '@nestjs/common';
import { MicrosoftService } from './microsoft.service';

@Module({ providers: [MicrosoftService], exports: [MicrosoftService] })
export class MicrosoftModule {}
