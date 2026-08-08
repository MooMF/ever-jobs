import { Module } from '@nestjs/common';
import { WelcomeToTheJungleService } from './wttj.service';

@Module({
  providers: [WelcomeToTheJungleService],
  exports: [WelcomeToTheJungleService],
})
export class WelcomeToTheJungleModule {}
