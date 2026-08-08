import { Module } from '@nestjs/common';
import { AllcareersService } from './allcareers.service';

@Module({ providers: [AllcareersService], exports: [AllcareersService] })
export class AllcareersModule {}
