// Watermark Placement Enum
export enum FilesWatermarkPlacementEnum {
  TOP_RIGHT = "TOP_RIGHT",
  TOP_CENTER = "TOP_CENTER",
  TOP_LEFT = "TOP_LEFT",
  MIDDLE = "MIDDLE",
  BOTTOM_RIGHT = "BOTTOM_RIGHT",
  BOTTOM_CENTER = "BOTTOM_CENTER",
  BOTTOM_LEFT = "BOTTOM_LEFT"
}

// Filename generator params type
export interface IFileNameGeneratorParams {
  metadata: any;
  allowedMimeTypes: string[];
}