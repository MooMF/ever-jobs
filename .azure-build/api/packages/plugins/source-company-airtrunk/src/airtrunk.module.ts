import { Module } from '@nestjs/common';
import { AirtrunkService } from './airtrunk.service';

@Module({ providers: [AirtrunkService], exports: [AirtrunkService] })
export class AirtrunkModule {}
