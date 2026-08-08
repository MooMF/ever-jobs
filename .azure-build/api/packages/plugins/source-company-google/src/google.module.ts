import { Module } from '@nestjs/common';
import { GoogleCareersService } from './google.service';

@Module({ providers: [GoogleCareersService], exports: [GoogleCareersService] })
export class GoogleCareersModule {}
