import { Module } from '@nestjs/common';
import { ClaraService } from './clara.service';

@Module({ providers: [ClaraService], exports: [ClaraService] })
export class ClaraModule {}
