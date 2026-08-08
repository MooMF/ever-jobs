import { Module } from '@nestjs/common';
import { Form3Service } from './form3.service';

@Module({ providers: [Form3Service], exports: [Form3Service] })
export class Form3Module {}
