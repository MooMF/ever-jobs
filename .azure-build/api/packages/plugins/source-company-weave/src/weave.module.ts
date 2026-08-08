import { Module } from '@nestjs/common';
import { WeaveService } from './weave.service';

@Module({ providers: [WeaveService], exports: [WeaveService] })
export class WeaveModule {}
