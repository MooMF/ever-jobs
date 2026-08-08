import { Module } from '@nestjs/common';
import { AffinidiService } from './affinidi.service';

@Module({ providers: [AffinidiService], exports: [AffinidiService] })
export class AffinidiModule {}
