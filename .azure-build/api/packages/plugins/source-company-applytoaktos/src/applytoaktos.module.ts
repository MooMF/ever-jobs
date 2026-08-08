import { Module } from '@nestjs/common';
import { ApplytoaktosService } from './applytoaktos.service';

@Module({ providers: [ApplytoaktosService], exports: [ApplytoaktosService] })
export class ApplytoaktosModule {}
