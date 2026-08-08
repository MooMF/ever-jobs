import { Module } from '@nestjs/common';
import { LetsGetCheckedService } from './letsgetchecked.service';

@Module({ providers: [LetsGetCheckedService], exports: [LetsGetCheckedService] })
export class LetsGetCheckedModule {}
