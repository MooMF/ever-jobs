import { Module } from '@nestjs/common';
import { GeneratebiomedicinesService } from './generatebiomedicines.service';

@Module({ providers: [GeneratebiomedicinesService], exports: [GeneratebiomedicinesService] })
export class GeneratebiomedicinesModule {}
