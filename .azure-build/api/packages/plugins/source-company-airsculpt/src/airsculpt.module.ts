import { Module } from '@nestjs/common';
import { AirsculptService } from './airsculpt.service';

@Module({ providers: [AirsculptService], exports: [AirsculptService] })
export class AirsculptModule {}
