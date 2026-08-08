import { Module } from '@nestjs/common';
import { MasterclassService } from './masterclass.service';

@Module({ providers: [MasterclassService], exports: [MasterclassService] })
export class MasterclassModule {}
