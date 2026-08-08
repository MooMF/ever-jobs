import { Module } from '@nestjs/common';
import { CockroachlabsService } from './cockroachlabs.service';

@Module({ providers: [CockroachlabsService], exports: [CockroachlabsService] })
export class CockroachlabsModule {}
