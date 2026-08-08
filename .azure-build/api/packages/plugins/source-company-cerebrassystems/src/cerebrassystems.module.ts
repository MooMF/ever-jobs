import { Module } from '@nestjs/common';
import { CerebrasSystemsService } from './cerebrassystems.service';

@Module({ providers: [CerebrasSystemsService], exports: [CerebrasSystemsService] })
export class CerebrasSystemsModule {}
