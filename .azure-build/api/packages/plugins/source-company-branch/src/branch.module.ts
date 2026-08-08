import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';

@Module({ providers: [BranchService], exports: [BranchService] })
export class BranchModule {}
