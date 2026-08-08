import { Module } from '@nestjs/common';
import { BuiltInService } from './builtin.service';

@Module({ providers: [BuiltInService], exports: [BuiltInService] })
export class BuiltInModule {}
