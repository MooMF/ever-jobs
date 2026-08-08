import { Module } from '@nestjs/common';
import { NutrafolService } from './nutrafol.service';

@Module({ providers: [NutrafolService], exports: [NutrafolService] })
export class NutrafolModule {}
