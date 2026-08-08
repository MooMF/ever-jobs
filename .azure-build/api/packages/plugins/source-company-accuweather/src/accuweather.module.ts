import { Module } from '@nestjs/common';
import { AccuWeatherService } from './accuweather.service';

@Module({ providers: [AccuWeatherService], exports: [AccuWeatherService] })
export class AccuWeatherModule {}
