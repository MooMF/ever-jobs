import { Module } from '@nestjs/common';
import { AluService } from './alu.service';

@Module({ providers: [AluService], exports: [AluService] })
export class AluModule {}
