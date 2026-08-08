import { Module } from '@nestjs/common';
import { GlossierService } from './glossier.service';

@Module({ providers: [GlossierService], exports: [GlossierService] })
export class GlossierModule {}
