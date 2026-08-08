import { Module } from '@nestjs/common';
import { ValenceLabsService } from './valencelabs.service';

@Module({ providers: [ValenceLabsService], exports: [ValenceLabsService] })
export class ValenceLabsModule {}
