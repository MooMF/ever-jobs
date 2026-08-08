import { Module } from '@nestjs/common';
import { AfreshService } from './afresh.service';

@Module({ providers: [AfreshService], exports: [AfreshService] })
export class AfreshModule {}
