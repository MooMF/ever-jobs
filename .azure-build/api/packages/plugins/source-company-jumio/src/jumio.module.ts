import { Module } from '@nestjs/common';
import { JumioService } from './jumio.service';

@Module({ providers: [JumioService], exports: [JumioService] })
export class JumioModule {}
