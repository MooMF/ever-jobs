import { Module } from '@nestjs/common';
import { ClutchService } from './clutch.service';

@Module({ providers: [ClutchService], exports: [ClutchService] })
export class ClutchModule {}
