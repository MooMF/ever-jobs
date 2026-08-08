import { Module } from '@nestjs/common';
import { FubotvService } from './fubotv.service';

@Module({ providers: [FubotvService], exports: [FubotvService] })
export class FubotvModule {}
