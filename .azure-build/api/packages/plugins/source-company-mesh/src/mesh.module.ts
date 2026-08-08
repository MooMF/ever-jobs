import { Module } from '@nestjs/common';
import { MeshPaymentsService } from './mesh.service';

@Module({ providers: [MeshPaymentsService], exports: [MeshPaymentsService] })
export class MeshPaymentsModule {}
