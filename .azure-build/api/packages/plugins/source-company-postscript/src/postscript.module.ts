import { Module } from '@nestjs/common';
import { PostscriptService } from './postscript.service';

@Module({ providers: [PostscriptService], exports: [PostscriptService] })
export class PostscriptModule {}
