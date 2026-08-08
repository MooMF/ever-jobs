import { Module } from '@nestjs/common';
import { CartaService } from './carta.service';

@Module({ providers: [CartaService], exports: [CartaService] })
export class CartaModule {}
