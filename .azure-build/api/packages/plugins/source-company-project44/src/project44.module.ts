import { Module } from '@nestjs/common';
import { Project44Service } from './project44.service';

@Module({ providers: [Project44Service], exports: [Project44Service] })
export class Project44Module {}
