import { Module } from '@nestjs/common';
import { ProfluentService } from './profluent.service';

@Module({ providers: [ProfluentService], exports: [ProfluentService] })
export class ProfluentModule {}
