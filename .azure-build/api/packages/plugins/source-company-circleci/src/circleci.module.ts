import { Module } from '@nestjs/common';
import { CircleCIService } from './circleci.service';

@Module({ providers: [CircleCIService], exports: [CircleCIService] })
export class CircleCIModule {}
