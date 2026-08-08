import { Module } from '@nestjs/common';
import { DatacampService } from './datacamp.service';

@Module({ providers: [DatacampService], exports: [DatacampService] })
export class DatacampModule {}
