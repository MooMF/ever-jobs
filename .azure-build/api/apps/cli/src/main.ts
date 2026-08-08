import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

async function bootstrap() {
  await CommandFactory.run(CliModule, {
    logger: ['error', 'warn'],
    errorHandler: (err) => {
      console.error('Error:', err.message);
      process.exit(1);
    },
  });
}

bootstrap();
