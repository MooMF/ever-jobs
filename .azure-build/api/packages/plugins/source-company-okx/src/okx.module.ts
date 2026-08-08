import { Module } from '@nestjs/common';
import { OKXService } from './okx.service';

@Module({ providers: [OKXService], exports: [OKXService] })
export class OKXModule {}
