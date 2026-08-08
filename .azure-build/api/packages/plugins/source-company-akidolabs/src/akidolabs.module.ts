import { Module } from '@nestjs/common';
import { AkidolabsService } from './akidolabs.service';

@Module({ providers: [AkidolabsService], exports: [AkidolabsService] })
export class AkidolabsModule {}
