import { Module } from '@nestjs/common';
import { N26Service } from './n26.service';

@Module({ providers: [N26Service], exports: [N26Service] })
export class N26Module {}
