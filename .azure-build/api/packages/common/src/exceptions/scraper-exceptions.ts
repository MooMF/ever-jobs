import { HttpException, HttpStatus } from '@nestjs/common';

export class LinkedInException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with LinkedIn', HttpStatus.BAD_GATEWAY);
  }
}

export class IndeedException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with Indeed', HttpStatus.BAD_GATEWAY);
  }
}

export class ZipRecruiterException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with ZipRecruiter', HttpStatus.BAD_GATEWAY);
  }
}

export class GlassdoorException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with Glassdoor', HttpStatus.BAD_GATEWAY);
  }
}

export class GoogleJobsException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with Google Jobs', HttpStatus.BAD_GATEWAY);
  }
}

export class BaytException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with Bayt', HttpStatus.BAD_GATEWAY);
  }
}

export class NaukriException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with Naukri', HttpStatus.BAD_GATEWAY);
  }
}

export class BDJobsException extends HttpException {
  constructor(message?: string) {
    super(message ?? 'An error occurred with BDJobs', HttpStatus.BAD_GATEWAY);
  }
}
