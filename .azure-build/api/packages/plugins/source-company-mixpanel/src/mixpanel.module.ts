import { Module } from '@nestjs/common';
import { MixpanelService } from './mixpanel.service';

@Module({ providers: [MixpanelService], exports: [MixpanelService] })
export class MixpanelModule {}
