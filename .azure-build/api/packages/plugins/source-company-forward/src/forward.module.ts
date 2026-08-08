import { Module } from '@nestjs/common';
import { ForwardService } from './forward.service';

@Module({ providers: [ForwardService], exports: [ForwardService] })
export class ForwardModule {}
