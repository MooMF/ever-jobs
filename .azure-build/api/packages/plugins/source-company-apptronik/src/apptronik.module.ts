import { Module } from '@nestjs/common';
import { ApptronikService } from './apptronik.service';

@Module({ providers: [ApptronikService], exports: [ApptronikService] })
export class ApptronikModule {}
