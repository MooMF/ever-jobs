import { Module } from '@nestjs/common';
import { AciLearningService } from './aci-learning.service';

@Module({ providers: [AciLearningService], exports: [AciLearningService] })
export class AciLearningModule {}
