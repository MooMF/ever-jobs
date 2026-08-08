import { Module } from '@nestjs/common';
import { NewLimitService } from './newlimit.service';

@Module({ providers: [NewLimitService], exports: [NewLimitService] })
export class NewLimitModule {}
