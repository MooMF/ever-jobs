import { Module } from '@nestjs/common';
import { C6BankService } from './c6bank.service';

@Module({ providers: [C6BankService], exports: [C6BankService] })
export class C6BankModule {}
