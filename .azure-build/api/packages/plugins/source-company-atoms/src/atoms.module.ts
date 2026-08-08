import { Module } from '@nestjs/common';
import { AtomsTechService } from './atoms.service';

@Module({ providers: [AtomsTechService], exports: [AtomsTechService] })
export class AtomsTechModule {}
