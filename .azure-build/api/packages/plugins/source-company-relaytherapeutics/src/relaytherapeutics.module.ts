import { Module } from '@nestjs/common';
import { RelaytherapeuticsService } from './relaytherapeutics.service';

@Module({ providers: [RelaytherapeuticsService], exports: [RelaytherapeuticsService] })
export class RelaytherapeuticsModule {}
