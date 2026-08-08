import { Module } from '@nestjs/common';
import { FourkitesService } from './fourkites.service';

@Module({ providers: [FourkitesService], exports: [FourkitesService] })
export class FourkitesModule {}
