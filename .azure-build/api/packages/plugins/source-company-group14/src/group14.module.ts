import { Module } from '@nestjs/common';
import { Group14Service } from './group14.service';

@Module({ providers: [Group14Service], exports: [Group14Service] })
export class Group14Module {}
