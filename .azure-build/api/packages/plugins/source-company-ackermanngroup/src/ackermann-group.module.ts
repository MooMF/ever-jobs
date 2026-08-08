import { Module } from '@nestjs/common';
import { AckermannGroupService } from './ackermann-group.service';

@Module({ providers: [AckermannGroupService], exports: [AckermannGroupService] })
export class AckermannGroupModule {}
