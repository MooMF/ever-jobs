import { Module } from '@nestjs/common';
import { OnRunningService } from './onrunning.service';

@Module({ providers: [OnRunningService], exports: [OnRunningService] })
export class OnRunningModule {}
