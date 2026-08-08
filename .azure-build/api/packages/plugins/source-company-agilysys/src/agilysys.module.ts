import { Module } from '@nestjs/common';
import { AgilysysService } from './agilysys.service';

@Module({ providers: [AgilysysService], exports: [AgilysysService] })
export class AgilysysModule {}
