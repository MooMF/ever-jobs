import { Module } from '@nestjs/common';
import { ApaleoService } from './apaleo.service';

@Module({ providers: [ApaleoService], exports: [ApaleoService] })
export class ApaleoModule {}
