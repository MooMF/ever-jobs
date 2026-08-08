import { Module } from '@nestjs/common';
import { TranscarentService } from './transcarent.service';

@Module({ providers: [TranscarentService], exports: [TranscarentService] })
export class TranscarentModule {}
