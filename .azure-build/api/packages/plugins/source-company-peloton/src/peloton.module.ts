import { Module } from '@nestjs/common';
import { PelotonService } from './peloton.service';

@Module({ providers: [PelotonService], exports: [PelotonService] })
export class PelotonModule {}
