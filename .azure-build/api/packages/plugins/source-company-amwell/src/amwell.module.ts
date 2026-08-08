import { Module } from '@nestjs/common';
import { AmwellService } from './amwell.service';

@Module({ providers: [AmwellService], exports: [AmwellService] })
export class AmwellModule {}
