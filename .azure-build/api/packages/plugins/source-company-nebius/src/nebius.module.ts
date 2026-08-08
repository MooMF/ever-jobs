import { Module } from '@nestjs/common';
import { NebiusService } from './nebius.service';

@Module({ providers: [NebiusService], exports: [NebiusService] })
export class NebiusModule {}
