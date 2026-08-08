import { Module } from '@nestjs/common';
import { Addepar1Service } from './addepar1.service';

@Module({ providers: [Addepar1Service], exports: [Addepar1Service] })
export class Addepar1Module {}
