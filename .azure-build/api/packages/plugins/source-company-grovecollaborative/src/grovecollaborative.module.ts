import { Module } from '@nestjs/common';
import { GroveCollaborativeService } from './grovecollaborative.service';

@Module({ providers: [GroveCollaborativeService], exports: [GroveCollaborativeService] })
export class GroveCollaborativeModule {}
