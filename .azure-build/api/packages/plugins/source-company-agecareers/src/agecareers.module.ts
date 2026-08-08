import { Module } from '@nestjs/common';
import { AgecareersService } from './agecareers.service';

@Module({ providers: [AgecareersService], exports: [AgecareersService] })
export class AgecareersModule {}
