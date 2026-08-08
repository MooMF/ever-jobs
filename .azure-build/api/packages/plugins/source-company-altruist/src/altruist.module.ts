import { Module } from '@nestjs/common';
import { AltruistService } from './altruist.service';

@Module({ providers: [AltruistService], exports: [AltruistService] })
export class AltruistModule {}
