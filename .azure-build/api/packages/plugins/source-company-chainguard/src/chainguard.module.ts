import { Module } from '@nestjs/common';
import { ChainguardService } from './chainguard.service';

@Module({ providers: [ChainguardService], exports: [ChainguardService] })
export class ChainguardModule {}
