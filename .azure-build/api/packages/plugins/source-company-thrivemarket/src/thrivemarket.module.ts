import { Module } from '@nestjs/common';
import { ThrivemarketService } from './thrivemarket.service';

@Module({ providers: [ThrivemarketService], exports: [ThrivemarketService] })
export class ThrivemarketModule {}
