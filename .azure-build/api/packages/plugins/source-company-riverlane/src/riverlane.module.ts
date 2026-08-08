import { Module } from '@nestjs/common';
import { RiverlaneService } from './riverlane.service';

@Module({ providers: [RiverlaneService], exports: [RiverlaneService] })
export class RiverlaneModule {}
