export interface ICommentSanitizerResult {
  sanitizedTitle: string | null;
  sanitizedContent: string;
  isApproved: boolean;
}