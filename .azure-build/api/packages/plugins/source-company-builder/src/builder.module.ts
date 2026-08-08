import { Module } from '@nestjs/common';
import { BuilderService } from './builder.service';

@Module({ providers: [BuilderService], exports: [BuilderService] })
export class BuilderModule {}
