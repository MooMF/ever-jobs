import { Module } from '@nestjs/common';
import { CerebralService } from './cerebral.service';

@Module({ providers: [CerebralService], exports: [CerebralService] })
export class CerebralModule {}
