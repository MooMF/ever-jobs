import { Module } from '@nestjs/common';
import { Align46Service } from './align46.service';

@Module({ providers: [Align46Service], exports: [Align46Service] })
export class Align46Module {}
