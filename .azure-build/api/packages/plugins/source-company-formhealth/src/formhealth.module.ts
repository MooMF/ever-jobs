import { Module } from '@nestjs/common';
import { FormHealthService } from './formhealth.service';

@Module({ providers: [FormHealthService], exports: [FormHealthService] })
export class FormHealthModule {}
