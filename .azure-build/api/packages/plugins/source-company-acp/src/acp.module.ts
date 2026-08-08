import { Module } from '@nestjs/common';
import { AcpService } from './acp.service';

@Module({ providers: [AcpService], exports: [AcpService] })
export class AcpModule {}
