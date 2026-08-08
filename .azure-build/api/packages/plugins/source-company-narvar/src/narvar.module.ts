import { Module } from '@nestjs/common';
import { NarvarService } from './narvar.service';

@Module({ providers: [NarvarService], exports: [NarvarService] })
export class NarvarModule {}
