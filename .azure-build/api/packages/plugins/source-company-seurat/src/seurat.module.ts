import { Module } from '@nestjs/common';
import { SeuratTechnologiesService } from './seurat.service';

@Module({ providers: [SeuratTechnologiesService], exports: [SeuratTechnologiesService] })
export class SeuratTechnologiesModule {}
