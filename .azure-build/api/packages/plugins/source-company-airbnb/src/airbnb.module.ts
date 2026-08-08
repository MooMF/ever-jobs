import { Module } from '@nestjs/common';
import { AirbnbService } from './airbnb.service';

@Module({ providers: [AirbnbService], exports: [AirbnbService] })
export class AirbnbModule {}
