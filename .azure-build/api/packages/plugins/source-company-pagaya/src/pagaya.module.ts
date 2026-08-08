import { Module } from '@nestjs/common';
import { PagayaService } from './pagaya.service';

@Module({ providers: [PagayaService], exports: [PagayaService] })
export class PagayaModule {}
