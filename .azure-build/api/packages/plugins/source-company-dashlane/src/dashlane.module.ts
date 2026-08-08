import { Module } from '@nestjs/common';
import { DashlaneService } from './dashlane.service';

@Module({ providers: [DashlaneService], exports: [DashlaneService] })
export class DashlaneModule {}
