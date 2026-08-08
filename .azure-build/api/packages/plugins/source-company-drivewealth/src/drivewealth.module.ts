import { Module } from '@nestjs/common';
import { DriveWealthService } from './drivewealth.service';

@Module({ providers: [DriveWealthService], exports: [DriveWealthService] })
export class DriveWealthModule {}
