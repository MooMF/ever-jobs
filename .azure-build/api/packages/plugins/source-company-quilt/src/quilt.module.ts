import { Module } from '@nestjs/common';
import { QuiltService } from './quilt.service';

@Module({ providers: [QuiltService], exports: [QuiltService] })
export class QuiltModule {}
