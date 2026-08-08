import { Module } from '@nestjs/common';
import { AcrisureInnovationService } from './acrisure-innovation.service';

@Module({ providers: [AcrisureInnovationService], exports: [AcrisureInnovationService] })
export class AcrisureInnovationModule {}
