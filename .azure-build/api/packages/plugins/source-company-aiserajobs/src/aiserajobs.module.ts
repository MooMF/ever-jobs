import { Module } from '@nestjs/common';
import { AiserajobsService } from './aiserajobs.service';

@Module({ providers: [AiserajobsService], exports: [AiserajobsService] })
export class AiserajobsModule {}
