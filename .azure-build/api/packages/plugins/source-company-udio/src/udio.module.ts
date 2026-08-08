import { Module } from '@nestjs/common';
import { UdioService } from './udio.service';

@Module({ providers: [UdioService], exports: [UdioService] })
export class UdioModule {}
