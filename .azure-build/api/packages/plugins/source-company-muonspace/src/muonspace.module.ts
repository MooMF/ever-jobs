import { Module } from '@nestjs/common';
import { MuonSpaceService } from './muonspace.service';

@Module({ providers: [MuonSpaceService], exports: [MuonSpaceService] })
export class MuonSpaceModule {}
