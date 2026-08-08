import { Module } from '@nestjs/common';
import { BanyanInfrastructureService } from './banyaninfrastructure.service';

@Module({ providers: [BanyanInfrastructureService], exports: [BanyanInfrastructureService] })
export class BanyanInfrastructureModule {}
