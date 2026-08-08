import { Module } from '@nestjs/common';
import { DatabricksService } from './databricks.service';

@Module({ providers: [DatabricksService], exports: [DatabricksService] })
export class DatabricksModule {}
