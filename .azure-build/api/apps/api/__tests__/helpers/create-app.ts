/**
 * Shared test helper — bootstraps the full NestJS application for E2E tests.
 *
 * Uses AppModule (not JobsModule) so all guards, interceptors, filters,
 * and config are active. Mirrors main.ts by applying ValidationPipe.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.init();
  return app;
}
