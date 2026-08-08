import { Module } from '@nestjs/common';
import { AmylyxService } from './amylyx.service';

@Module({ providers: [AmylyxService], exports: [AmylyxService] })
export class AmylyxModule {}
