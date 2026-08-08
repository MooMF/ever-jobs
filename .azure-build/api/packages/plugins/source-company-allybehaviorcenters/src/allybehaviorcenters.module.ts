import { Module } from '@nestjs/common';
import { AllybehaviorcentersService } from './allybehaviorcenters.service';

@Module({ providers: [AllybehaviorcentersService], exports: [AllybehaviorcentersService] })
export class AllybehaviorcentersModule {}
