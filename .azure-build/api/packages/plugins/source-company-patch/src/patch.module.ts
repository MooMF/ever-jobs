import { Module } from '@nestjs/common';
import { PatchCaregivingService } from './patch.service';

@Module({ providers: [PatchCaregivingService], exports: [PatchCaregivingService] })
export class PatchCaregivingModule {}
