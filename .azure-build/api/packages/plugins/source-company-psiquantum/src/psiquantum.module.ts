import { Module } from '@nestjs/common';
import { PsiQuantumService } from './psiquantum.service';

@Module({ providers: [PsiQuantumService], exports: [PsiQuantumService] })
export class PsiQuantumModule {}
