import { api } from './client';

export interface SMConnections {
  allCount: number;
  webmailCount: number;
  imapCount: number;
  easCount: number;
  mapiEwsCount: number;
  popCount: number;
  xmppCount: number;
  smtpCount: number;
  allUsersCount: number;
}

export interface SMDiskUsage {
  used: number;
  mailboxUsed: number;
  fileStorageUsed: number;
  allowed: number;
}

export interface SMSummary {
  incoming:   Record<string, number>;
  outgoing:   Record<string, number>;
  bwOverview: Record<string, number>;
  spam:       Record<string, number>;
  greylist:   Record<string, number>;
  throttled:  Record<string, number>;
  sessions:   Record<string, number>;
}

export interface SMSummaryResponse {
  diskPct:   number;
  diskUsage: SMDiskUsage;
  summary:   SMSummary;
}

export const getSMConnections = () => api.get<SMConnections>('/smartermail/connections');
export const getSMSummary     = () => api.get<SMSummaryResponse>('/smartermail/summary');
