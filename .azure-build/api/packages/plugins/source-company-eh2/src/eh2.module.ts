import { Module } from '@nestjs/common';
import { Eh2Service } from './eh2.service';

@Module({ providers: [Eh2Service], exports: [Eh2Service] })
export class Eh2Module {}
