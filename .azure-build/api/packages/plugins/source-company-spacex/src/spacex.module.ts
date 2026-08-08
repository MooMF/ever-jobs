import { Module } from '@nestjs/common';
import { SpaceXService } from './spacex.service';

@Module({ providers: [SpaceXService], exports: [SpaceXService] })
export class SpaceXModule {}
