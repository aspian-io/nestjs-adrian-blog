import { JobId } from "bull";

export interface NewsletterDelayedCampaignsJobs {
  jobId: JobId;
  name: string;
  emailSubject: string;
}

export interface NewsletterAwsSnsSubscription {
  Type: 'Notification';
  MessageId: string;
  Token: string;
  TopicArn: string;
  Message: string;
  SubscribeURL: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

export type AwsSesNotificationType = 'Bounce' | 'Complaint' | 'Delivery';

export interface AwsSesMail {
  timestamp: string;
  messageId: string;
  source: string;
  sourceArn: string;
  sourceIp: string;
  sendingAccountId: string;
  callerIdentity: string;
  destination: string[];
}

export interface AwsSesBounceRecipient {
  emailAddress: string;
  action: string;
  status: string;
  diagnosticCode: string;
}

export enum AwsSesBounceTypeEnum {
  Undetermined = "Undetermined",
  Permanent = "Permanent",
  Transient = "Transient"
}

export enum AwsSesBounceSubTypeEnum {
  Undetermined = "Undetermined",
  General = "General",
  NoEmail = "NoEmail",
  Suppressed = "Suppressed",
  OnAccountSuppressionList = "OnAccountSuppressionList",
  MailboxFull = "MailboxFull",
  MessageTooLarge = "MessageTooLarge",
  ContentRejected = "ContentRejected",
  AttachmentRejected = "AttachmentRejected"
}

export interface AwsSesBounce {
  bounceType: AwsSesBounceTypeEnum;
  bounceSubType: AwsSesBounceSubTypeEnum;
  bouncedRecipients: AwsSesBounceRecipient[];
  timestamp: string;
  feedbackId: string;
}

// AWS SES bounce notification type
export interface NewsletterAwsSesBounceNotification {
  notificationType: AwsSesNotificationType;
  mail: AwsSesMail;
  bounce: AwsSesBounce;
}

export interface AwsSesComplaintRecipient {
  emailAddress: string;
}

export enum AwsSesComplaintFeedbackType {
  abuse = "abuse",
  auth_failure = "auth-failure",
  fraud = "fraud",
  not_spam = "not-spam",
  other = "other",
  virus = "virus"
}

export interface AwsSesComplaint {
  complainedRecipients: AwsSesComplaintRecipient[];
  timestamp: string;
  feedbackId: string;
  userAgent?: string;
  complaintFeedbackType?: AwsSesComplaintFeedbackType;
  arrivalDate?: string;
}

// AWS SES complaint notification type
export interface NewsletterAwsSesComplaintNotification {
  notificationType: AwsSesNotificationType;
  mail: AwsSesMail;
  complaint: AwsSesComplaint;
}