import { Module } from '@nestjs/common';
import { AmplitudeService } from './amplitude.service';

@Module({ providers: [AmplitudeService], exports: [AmplitudeService] })
export class AmplitudeModule {}
