import { Module } from '@nestjs/common';
import { ProtonService } from './proton.service';

@Module({ providers: [ProtonService], exports: [ProtonService] })
export class ProtonModule {}
