import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

import { TelemetryEvent } from './telemetry.types';

@Injectable()
export class TelemetryService {
  private readonly basePath =
    process.env.EVER_JOBS_TELEMETRY_PATH ??
    path.join(process.cwd(), 'telemetry');

  async capture(event: TelemetryEvent): Promise<void> {
    try {
      if (this.shouldIgnore(event)) {
        return;
      }

      const timestamp = event.timestamp
        ? new Date(event.timestamp)
        : new Date();

      const datePart = timestamp.toISOString().slice(0, 10);

      const source = this.sanitize(
        event.source || 'unknown',
      );

      const directory = path.join(
        this.basePath,
        datePart,
        source,
      );

      await fs.mkdir(directory, {
        recursive: true,
      });

      const timePart = timestamp
        .toISOString()
        .replace(/[:.]/g, '-');

      const filename =
        `${timePart}-${randomUUID()}.json`;

      const filePath = path.join(
        directory,
        filename,
      );

      const telemetryRecord: TelemetryEvent = {
        ...event,
        timestamp: timestamp.toISOString(),
      };

      await fs.writeFile(
        filePath,
        JSON.stringify(
          telemetryRecord,
          this.jsonReplacer,
          2,
        ),
        'utf8',
      );
    } catch {
      // Telemetry is deliberately disposable.
      // Never propagate telemetry failures into the search path.
    }
  }

  /**
   * Synthetic operational probes are deliberately excluded from
   * telemetry so they do not contaminate real search data.
   *
   * Keep this decision inside TelemetryService: callers should simply
   * submit events and should not need to know whether an event will
   * ultimately be persisted.
   */
  private shouldIgnore(event: TelemetryEvent): boolean {
    const query = event.query
      ?.trim()
      .toLowerCase();

    const location = event.location
      ?.trim()
      .toLowerCase();

    if (
      query === 'warehouse' &&
      location === 'england'
    ) {
      return true;
    }

    return false;
  }

  private sanitize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '_');
  }

  private jsonReplacer(
    _key: string,
    value: unknown,
  ): unknown {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    return value;
  }
}