import { Module } from '@nestjs/common';
import { ZolaService } from './zola.service';

@Module({ providers: [ZolaService], exports: [ZolaService] })
export class ZolaModule {}
