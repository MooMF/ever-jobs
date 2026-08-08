import { Module } from '@nestjs/common';
import { BuildkiteService } from './buildkite.service';

@Module({ providers: [BuildkiteService], exports: [BuildkiteService] })
export class BuildkiteModule {}
