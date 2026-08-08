import { Module } from '@nestjs/common';
import { InceptiveService } from './inceptive.service';

@Module({ providers: [InceptiveService], exports: [InceptiveService] })
export class InceptiveModule {}
