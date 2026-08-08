import { Module } from '@nestjs/common';
import { BetterHelpService } from './betterhelp.service';

@Module({ providers: [BetterHelpService], exports: [BetterHelpService] })
export class BetterHelpModule {}
