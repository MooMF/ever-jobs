import { Module } from '@nestjs/common';
import { XenditService } from './xendit.service';

@Module({ providers: [XenditService], exports: [XenditService] })
export class XenditModule {}
