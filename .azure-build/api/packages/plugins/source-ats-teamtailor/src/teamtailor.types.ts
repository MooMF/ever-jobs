/**
 * TypeScript interfaces for Teamtailor API responses.
 */

export interface TeamtailorResponse {
  data: TeamtailorJob[];
  links?: {
    self?: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta?: {
    'record-count'?: number;
    'page-count'?: number;
  };
}

export interface TeamtailorJob {
  id: string;
  type: string;
  attributes: {
    title: string;
    body: string;
    pitch?: string;
    'employment-type'?: string;
    'external-url'?: string;
    'apply-url'?: string;
    remote?: boolean;
    'created-at'?: string;
    'updated-at'?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  relationships?: {
    department?: { data?: { id: string } };
  };
  links?: {
    self?: string;
    'careersite-url'?: string;
  };
}
