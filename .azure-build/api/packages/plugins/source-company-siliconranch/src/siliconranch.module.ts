import { Module } from '@nestjs/common';
import { SiliconRanchService } from './siliconranch.service';

@Module({ providers: [SiliconRanchService], exports: [SiliconRanchService] })
export class SiliconRanchModule {}
