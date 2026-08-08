import { Module } from '@nestjs/common';
import { FoxService } from './fox.service';

@Module({ providers: [FoxService], exports: [FoxService] })
export class FoxModule {}
