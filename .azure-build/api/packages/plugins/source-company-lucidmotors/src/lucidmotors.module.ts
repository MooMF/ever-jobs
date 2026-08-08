import { Module } from '@nestjs/common';
import { LucidmotorsService } from './lucidmotors.service';

@Module({ providers: [LucidmotorsService], exports: [LucidmotorsService] })
export class LucidmotorsModule {}
