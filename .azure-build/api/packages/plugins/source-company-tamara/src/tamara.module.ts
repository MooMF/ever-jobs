import { Module } from '@nestjs/common';
import { TamaraService } from './tamara.service';

@Module({ providers: [TamaraService], exports: [TamaraService] })
export class TamaraModule {}
