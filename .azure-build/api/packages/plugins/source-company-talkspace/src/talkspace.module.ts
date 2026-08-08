import { Module } from '@nestjs/common';
import { TalkspaceService } from './talkspace.service';

@Module({ providers: [TalkspaceService], exports: [TalkspaceService] })
export class TalkspaceModule {}
