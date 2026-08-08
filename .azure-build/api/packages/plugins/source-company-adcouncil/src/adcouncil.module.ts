import { Module } from '@nestjs/common';
import { AdcouncilService } from './adcouncil.service';

@Module({ providers: [AdcouncilService], exports: [AdcouncilService] })
export class AdcouncilModule {}
