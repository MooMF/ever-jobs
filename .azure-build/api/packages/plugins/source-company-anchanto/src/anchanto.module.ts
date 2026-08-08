import { Module } from '@nestjs/common';
import { AnchantoService } from './anchanto.service';

@Module({ providers: [AnchantoService], exports: [AnchantoService] })
export class AnchantoModule {}
