import { Module } from '@nestjs/common';
import { AlphasenseindiaService } from './alphasenseindia.service';

@Module({ providers: [AlphasenseindiaService], exports: [AlphasenseindiaService] })
export class AlphasenseindiaModule {}
