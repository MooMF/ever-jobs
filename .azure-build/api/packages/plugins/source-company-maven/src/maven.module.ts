import { Module } from '@nestjs/common';
import { MavenService } from './maven.service';

@Module({ providers: [MavenService], exports: [MavenService] })
export class MavenModule {}
