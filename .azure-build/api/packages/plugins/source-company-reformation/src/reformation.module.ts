import { Module } from '@nestjs/common';
import { ReformationService } from './reformation.service';

@Module({ providers: [ReformationService], exports: [ReformationService] })
export class ReformationModule {}
