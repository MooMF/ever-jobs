import { Module } from '@nestjs/common';
import { AdvancedspaceService } from './advancedspace.service';

@Module({ providers: [AdvancedspaceService], exports: [AdvancedspaceService] })
export class AdvancedspaceModule {}
