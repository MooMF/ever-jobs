import { Module } from '@nestjs/common';
import { KikoffService } from './kikoff.service';

@Module({ providers: [KikoffService], exports: [KikoffService] })
export class KikoffModule {}
