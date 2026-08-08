import { Module } from '@nestjs/common';
import { MaterializeService } from './materialize.service';

@Module({ providers: [MaterializeService], exports: [MaterializeService] })
export class MaterializeModule {}
