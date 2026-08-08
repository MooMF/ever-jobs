import { Module } from '@nestjs/common';
import { SurveymonkeyService } from './surveymonkey.service';

@Module({ providers: [SurveymonkeyService], exports: [SurveymonkeyService] })
export class SurveymonkeyModule {}
