import { Module } from '@nestjs/common';
import { CuyanaService } from './cuyana.service';

@Module({ providers: [CuyanaService], exports: [CuyanaService] })
export class CuyanaModule {}
