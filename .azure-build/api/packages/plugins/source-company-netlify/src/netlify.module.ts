import { Module } from '@nestjs/common';
import { NetlifyService } from './netlify.service';

@Module({ providers: [NetlifyService], exports: [NetlifyService] })
export class NetlifyModule {}
