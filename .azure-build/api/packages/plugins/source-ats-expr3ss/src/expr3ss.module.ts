import { Module } from '@nestjs/common';
import { Expr3ssService } from './expr3ss.service';

@Module({
  providers: [Expr3ssService],
  exports: [Expr3ssService],
})
export class Expr3ssModule {}
