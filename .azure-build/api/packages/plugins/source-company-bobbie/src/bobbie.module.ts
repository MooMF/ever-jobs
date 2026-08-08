import { Module } from '@nestjs/common';
import { BobbieService } from './bobbie.service';

@Module({ providers: [BobbieService], exports: [BobbieService] })
export class BobbieModule {}
