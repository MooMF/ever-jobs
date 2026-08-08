import { Module } from '@nestjs/common';
import { TextioService } from './textio.service';

@Module({ providers: [TextioService], exports: [TextioService] })
export class TextioModule {}
