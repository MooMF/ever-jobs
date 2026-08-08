import { Module } from '@nestjs/common';
import { HomechefService } from './homechef.service';

@Module({ providers: [HomechefService], exports: [HomechefService] })
export class HomechefModule {}
