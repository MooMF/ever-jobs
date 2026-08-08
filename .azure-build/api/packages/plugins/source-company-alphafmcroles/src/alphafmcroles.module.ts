import { Module } from '@nestjs/common';
import { AlphafmcrolesService } from './alphafmcroles.service';

@Module({ providers: [AlphafmcrolesService], exports: [AlphafmcrolesService] })
export class AlphafmcrolesModule {}
