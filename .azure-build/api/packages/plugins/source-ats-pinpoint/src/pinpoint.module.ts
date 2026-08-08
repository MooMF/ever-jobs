import { Module } from '@nestjs/common';
import { PinpointService } from './pinpoint.service';

@Module({ providers: [PinpointService], exports: [PinpointService] })
export class PinpointModule {}
