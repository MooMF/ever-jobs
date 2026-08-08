import { Module } from '@nestjs/common';
import { CriblService } from './cribl.service';

@Module({ providers: [CriblService], exports: [CriblService] })
export class CriblModule {}
