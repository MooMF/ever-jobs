import { Module } from '@nestjs/common';
import { AkoyaService } from './akoya.service';

@Module({ providers: [AkoyaService], exports: [AkoyaService] })
export class AkoyaModule {}
