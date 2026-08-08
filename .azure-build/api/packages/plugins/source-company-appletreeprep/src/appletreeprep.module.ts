import { Module } from '@nestjs/common';
import { AppletreeprepService } from './appletreeprep.service';

@Module({ providers: [AppletreeprepService], exports: [AppletreeprepService] })
export class AppletreeprepModule {}
