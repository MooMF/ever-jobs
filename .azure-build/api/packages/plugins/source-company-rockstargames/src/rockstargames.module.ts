import { Module } from '@nestjs/common';
import { RockstargamesService } from './rockstargames.service';

@Module({ providers: [RockstargamesService], exports: [RockstargamesService] })
export class RockstargamesModule {}
