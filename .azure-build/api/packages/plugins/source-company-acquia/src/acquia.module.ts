import { Module } from '@nestjs/common';
import { AcquiaService } from './acquia.service';

@Module({ providers: [AcquiaService], exports: [AcquiaService] })
export class AcquiaModule {}
