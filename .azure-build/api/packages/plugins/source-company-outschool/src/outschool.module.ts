import { Module } from '@nestjs/common';
import { OutschoolService } from './outschool.service';

@Module({ providers: [OutschoolService], exports: [OutschoolService] })
export class OutschoolModule {}
