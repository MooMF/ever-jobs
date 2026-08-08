import { Module } from '@nestjs/common';
import { HungryrootService } from './hungryroot.service';

@Module({ providers: [HungryrootService], exports: [HungryrootService] })
export class HungryrootModule {}
