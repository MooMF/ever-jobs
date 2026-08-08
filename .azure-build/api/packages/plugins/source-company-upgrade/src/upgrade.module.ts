import { Module } from '@nestjs/common';
import { UpgradeService } from './upgrade.service';

@Module({ providers: [UpgradeService], exports: [UpgradeService] })
export class UpgradeModule {}
