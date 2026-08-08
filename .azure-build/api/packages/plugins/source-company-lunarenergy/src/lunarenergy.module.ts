import { Module } from '@nestjs/common';
import { LunarenergyService } from './lunarenergy.service';

@Module({ providers: [LunarenergyService], exports: [LunarenergyService] })
export class LunarenergyModule {}
