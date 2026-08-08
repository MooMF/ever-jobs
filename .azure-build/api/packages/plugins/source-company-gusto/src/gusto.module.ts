import { Module } from '@nestjs/common';
import { GustoService } from './gusto.service';

@Module({ providers: [GustoService], exports: [GustoService] })
export class GustoModule {}
