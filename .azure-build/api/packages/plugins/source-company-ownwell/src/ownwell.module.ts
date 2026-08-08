import { Module } from '@nestjs/common';
import { OwnwellService } from './ownwell.service';

@Module({ providers: [OwnwellService], exports: [OwnwellService] })
export class OwnwellModule {}
