import { Module } from '@nestjs/common';
import { VerveGroupService } from './verve.service';

@Module({ providers: [VerveGroupService], exports: [VerveGroupService] })
export class VerveGroupModule {}
