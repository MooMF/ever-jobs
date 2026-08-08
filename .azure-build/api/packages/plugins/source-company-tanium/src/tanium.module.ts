import { Module } from '@nestjs/common';
import { TaniumService } from './tanium.service';

@Module({ providers: [TaniumService], exports: [TaniumService] })
export class TaniumModule {}
