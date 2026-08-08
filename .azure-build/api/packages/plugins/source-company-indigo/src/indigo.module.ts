import { Module } from '@nestjs/common';
import { IndigoService } from './indigo.service';

@Module({ providers: [IndigoService], exports: [IndigoService] })
export class IndigoModule {}
