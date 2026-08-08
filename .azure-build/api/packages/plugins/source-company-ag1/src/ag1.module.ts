import { Module } from '@nestjs/common';
import { Ag1Service } from './ag1.service';

@Module({ providers: [Ag1Service], exports: [Ag1Service] })
export class Ag1Module {}
