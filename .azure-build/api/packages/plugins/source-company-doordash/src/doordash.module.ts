import { Module } from '@nestjs/common';
import { DoorDashService } from './doordash.service';

@Module({ providers: [DoorDashService], exports: [DoorDashService] })
export class DoorDashModule {}
