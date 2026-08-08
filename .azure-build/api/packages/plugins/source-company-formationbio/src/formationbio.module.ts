import { Module } from '@nestjs/common';
import { FormationbioService } from './formationbio.service';

@Module({ providers: [FormationbioService], exports: [FormationbioService] })
export class FormationbioModule {}
