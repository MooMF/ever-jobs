import { Module } from '@nestjs/common';
import { AgilisysService } from './agilisys.service';

@Module({ providers: [AgilisysService], exports: [AgilisysService] })
export class AgilisysModule {}
