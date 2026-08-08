import { Module } from '@nestjs/common';
import { ApogeetherapeuticsService } from './apogeetherapeutics.service';

@Module({ providers: [ApogeetherapeuticsService], exports: [ApogeetherapeuticsService] })
export class ApogeetherapeuticsModule {}
