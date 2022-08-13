import { JobId } from "bull";

export interface NewsletterDelayedCampaignsJobs {
  jobId: JobId;
  name: string;
  emailSubject: string;
}