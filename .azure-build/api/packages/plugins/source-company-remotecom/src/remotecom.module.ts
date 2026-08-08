import { Module } from '@nestjs/common';
import { RemotecomService } from './remotecom.service';

@Module({ providers: [RemotecomService], exports: [RemotecomService] })
export class RemotecomModule {}
