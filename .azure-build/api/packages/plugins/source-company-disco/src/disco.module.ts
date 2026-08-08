import { Module } from '@nestjs/common';
import { DiscoService } from './disco.service';

@Module({ providers: [DiscoService], exports: [DiscoService] })
export class DiscoModule {}
