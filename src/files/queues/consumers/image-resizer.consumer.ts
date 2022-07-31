import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { FilesService } from 'src/files/files.service';
import { FileJobs } from '../jobs.enum';
import { FileQueues } from '../queues.enum';

export interface IImageResizerPayload {
  imageId: string;
}

@Processor( FileQueues.IMAGE_RESIZER )
export class ImageResizerJobConsumer {
  constructor ( private readonly filesService: FilesService ) { }

  @Process( FileJobs.IMAGE_RESIZER )
  async imageResizer ( job: Job<IImageResizerPayload> ) {
    try {
      await this.filesService.generateResizedWatermarkedImages( job.data.imageId );
      console.log( "Image generator job has been done successfully" );
    } catch ( error ) {
      console.log( "Something went wrong running image resizing job", error );
    }
  }
}