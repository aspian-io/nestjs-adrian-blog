import { BadRequestException, CACHE_MANAGER, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { InjectS3, S3 } from "nestjs-s3";
import * as sharp from 'sharp';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { File, FilePolicyEnum, FileSectionEnum, FileStatus, ImageSizeCategories } from './entities/file.entity';
import { Between, In, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { InjectQueue } from '@nestjs/bull';
import { FileQueues } from './queues/queues.enum';
import { Queue } from 'bull';
import { SettingsService } from 'src/settings/settings.service';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilesInfoLocale } from 'src/i18n/locale-keys/files/info.locale';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { FilesWatermarkPlacementEnum, IFileNameGeneratorParams } from './types/files-service.type';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { FileJobs } from './queues/jobs.enum';
import { IImageResizerPayload } from './queues/consumers/image-resizer.consumer';
import { FilesListQueryDto } from './dto/files-list-query.dto';
import { Cache } from 'cache-manager';
import { sanitize } from 'string-sanitizer';
import { S3 as S3Type } from "aws-sdk";
import { EnvEnum } from 'src/env.enum';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { FilesErrorsLocale } from 'src/i18n/locale-keys/files/errors.locale';

@Injectable()
export class FilesService {
  constructor (
    @InjectRepository( File ) private readonly fileRepository: Repository<File>,
    private readonly configService: ConfigService,
    @InjectS3() private readonly s3: S3,
    @InjectQueue( FileQueues.IMAGE_RESIZER ) private readonly imageResizerQueue: Queue<IImageResizerPayload>,
    private readonly settingsService: SettingsService,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache
  ) { }

  // Create new record of uploaded file information in database
  async create ( createFileDto: CreateFileDto, i18n: I18nContext, metadata: IMetadataDecorator ) {
    const duplicate = await this.fileRepository.findOne( { where: { key: createFileDto.key } } );
    if ( duplicate ) {
      throw new BadRequestException( i18n.t( FilesErrorsLocale.DUPLICATE_FILE ) );
    }

    let status = this.isFileTypeAllowed( createFileDto.type, [ 'image/*' ] )
      ? FileStatus.IN_PROGRESS
      : FileStatus.READY;

    if ( createFileDto.section === FileSectionEnum.SITE_LOGO || createFileDto.section === FileSectionEnum.BRAND_LOGO ) {
      status = FileStatus.READY;
    }

    const imageSizeCategory = this.isFileTypeAllowed( createFileDto.type, [ 'image/*' ] )
      ? ImageSizeCategories.ORIGINAL : null;

    const file = this.fileRepository.create( {
      ...createFileDto,
      imageSizeCategory,
      status,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    } );


    const savedFile = await this.fileRepository.save( file );

    if (
      savedFile.section !== FileSectionEnum.SITE_LOGO
      && savedFile.section !== FileSectionEnum.BRAND_LOGO
      && this.isFileTypeAllowed( savedFile.type, [ 'image/*' ] )
    ) {
      await this.imageResizerQueue.add( FileJobs.IMAGE_RESIZER, { imageId: savedFile.id } );
    }

    return savedFile;
  }

  // Find all uploaded files
  async findAll ( query: FilesListQueryDto ): Promise<IListResultGenerator<File>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    const [ items, totalItems ] = await this.fileRepository.findAndCount( {
      relations: {
        originalImage: true,
        generatedImageChildren: true,
        videoThumbnail: true
      },
      where: {
        filename: query[ 'searchBy.filename' ],
        key: query[ 'searchBy.key' ],
        policy: query[ 'filterBy.policy' ]?.length ? In( query[ 'filterBy.policy' ] ) : undefined,
        type: query[ 'filterBy.type' ]?.length ? In( query[ 'filterBy.type' ] ) : undefined,
        size: query[ 'filterBy.size' ]?.length
          ? Between( query[ 'filterBy.size' ][ 0 ], query[ 'filterBy.size' ][ 1 ] ) : undefined,
        status: query[ 'filterBy.status' ]?.length ? In( query[ 'filterBy.status' ] ) : undefined,
        section: query[ 'filterBy.section' ]?.length ? In( query[ 'filterBy.section' ] ) : undefined,
        imageSizeCategory: query[ 'filterBy.imageSizeCategory' ]?.length ? In( query[ 'filterBy.imageSizeCategory' ] ) : undefined,
        createdAt: query[ 'filterBy.createdAt' ]?.length
          ? Between( query[ 'filterBy.createdAt' ][ 0 ], query[ 'filterBy.createdAt' ][ 1 ] ) : undefined,
        updatedAt: query[ 'filterBy.updatedAt' ]?.length
          ? Between( query[ 'filterBy.updatedAt' ][ 0 ], query[ 'filterBy.updatedAt' ][ 1 ] ) : undefined,
      },
      order: {
        key: query[ 'orderBy.key' ],
        filename: query[ 'orderBy.filename' ],
        policy: query[ 'orderBy.policy' ],
        type: query[ 'orderBy.type' ],
        size: query[ 'orderBy.size' ],
        status: query[ 'orderBy.status' ],
        section: query[ 'orderBy.section' ],
        createdAt: query[ 'orderBy.createdAt' ],
        updatedAt: query[ 'orderBy.updatedAt' ],
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find an uploaded file info by its Id
  async findOneById ( id: string, i18n: I18nContext ) {
    const file = await this.fileRepository.findOne( {
      where: { id },
      relations: {
        generatedImageChildren: true,
        originalImage: true,
        videoThumbnail: true,
      }
    } );

    if ( !file ) throw new NotFoundLocalizedException( i18n, FilesInfoLocale.TERM_FILE );

    return file;
  }

  // Update uploaded file info and ACL
  async update ( id: string, updateFileDto: UpdateFileDto, i18n: I18nContext ) {
    const file = await this.fileRepository.findOne( {
      where: { id },
      relations: {
        originalImage: true,
        generatedImageChildren: true
      }
    } );
    if ( !file ) throw new NotFoundLocalizedException( i18n, FilesInfoLocale.TERM_FILE );

    // Update section of parent and children consequently if section changed
    if ( updateFileDto.section && updateFileDto.section !== file.section ) {
      if ( file.originalImage ) {
        file.originalImage.section = updateFileDto.section;
        await this.fileRepository.save( file.originalImage );
      }

      if ( file.generatedImageChildren.length ) {
        await Promise.all( file.generatedImageChildren.map( async ch => {
          ch.section = updateFileDto.section;
          await this.fileRepository.save( ch );
        } ) );
      }
    }

    // Update policies of parent and children consequently if policy changed
    if ( updateFileDto.policy && updateFileDto.policy !== file.policy ) {
      if ( file.originalImage ) {
        const originalImgParams = {
          Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
          Key: file.originalImage.key,
          ACL: updateFileDto.policy
        };
        await this.s3.putObjectAcl( originalImgParams ).promise();
        file.originalImage.policy = updateFileDto.policy;
        await this.fileRepository.save( file.originalImage );
      }

      if ( file.generatedImageChildren.length ) {
        await Promise.all( file.generatedImageChildren.map( async ch => {
          const childParams = {
            Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
            Key: ch.key,
            ACL: updateFileDto.policy
          };
          await this.s3.putObjectAcl( childParams ).promise();
          ch.policy = updateFileDto.policy;
          await this.fileRepository.save( ch );
        } ) );
      }
      const params = {
        Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
        Key: file.key,
        ACL: updateFileDto.policy
      };
      await this.s3.putObjectAcl( params ).promise();
    }

    Object.assign( file, updateFileDto );

    return this.fileRepository.save( file );
  }

  // Soft remove a file
  async softRemove ( i18n: I18nContext, id: string ): Promise<File> {
    const file = await this.fileRepository.findOne( {
      where: { id },
      relations: {
        originalImage: true,
        generatedImageChildren: true
      }
    } );
    if ( !file ) throw new NotFoundLocalizedException( i18n, FilesInfoLocale.TERM_FILE );

    if ( file.originalImage ) {
      await this.fileRepository.softRemove( file.originalImage );
    }

    if ( file.generatedImageChildren?.length ) {
      await Promise.all(
        file.generatedImageChildren.map( async ch => {
          await this.fileRepository.softRemove( ch );
        } )
      );
    }

    await this.cacheManager.reset();
    return this.fileRepository.softRemove( file );
  }

  // Bulk soft remove
  async bulkSoftRemove ( i18n: I18nContext, ids: string[] ) {
    return Promise.all(
      ids.map( async id => {
        return this.softRemove( i18n, id );
      } )
    );
  }

  // Recover a soft-removed file
  async recover ( i18n: I18nContext, id: string ): Promise<File> {
    const file = await this.fileRepository.findOne( {
      where: { id },
      withDeleted: true,
      relations: {
        originalImage: true,
        generatedImageChildren: true
      }
    } );
    if ( !file ) throw new NotFoundLocalizedException( i18n, FilesInfoLocale.TERM_FILE );

    if ( file.originalImage ) {
      await this.fileRepository.recover( file.originalImage );
    }

    if ( file.generatedImageChildren?.length ) {
      await Promise.all(
        file.generatedImageChildren.map( async ch => {
          await this.fileRepository.recover( ch );
        } )
      );
    }

    await this.cacheManager.reset();
    return this.fileRepository.recover( file );
  }

  // Bulk recover soft-removed files
  async bulkRecover ( i18n: I18nContext, ids: string[] ) {
    return Promise.all(
      ids.map( async id => {
        return await this.recover( i18n, id );
      } )
    );
  }

  // Remove a file permanently
  async remove ( i18n: I18nContext, id: string ): Promise<File> {
    const file = await this.fileRepository.findOne( {
      where: { id },
      withDeleted: true,
      relations: {
        originalImage: { generatedImageChildren: true },
        generatedImageChildren: true
      }
    } );
    if ( !file ) throw new NotFoundLocalizedException( i18n, FilesInfoLocale.TERM_FILE );

    if ( file.originalImage ) {
      await Promise.all(
        file.originalImage.generatedImageChildren.map( async ch => {
          const child = await this.fileRepository.remove( ch );
          await this.s3DeleteObject( {
            Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
            Key: child.key
          } );
        } )
      );
      const originalImage = await this.fileRepository.remove( file.originalImage );
      await this.s3DeleteObject( {
        Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
        Key: originalImage.key
      } );

      return originalImage;
    }

    if ( file.generatedImageChildren?.length ) {
      await Promise.all(
        file.generatedImageChildren.map( async ch => {
          const child = await this.fileRepository.remove( ch );
          await this.s3DeleteObject( {
            Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
            Key: child.key
          } );
        } )
      );
    }

    await this.cacheManager.reset();
    const result = await this.fileRepository.remove( file );

    await this.s3DeleteObject( {
      Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
      Key: result.key
    } );

    return result;
  }

  // Bulk remove permanently
  async bulkRemove ( i18n: I18nContext, ids: string[] ) {
    return Promise.all(
      ids.map( async id => {
        return this.remove( i18n, id );
      } )
    );
  }

  // Generate multiple sizes of an uploaded image
  async generateResizedWatermarkedImages ( imageId: string ) {
    // Get original image info from database
    const image = await this.fileRepository.findOne( { where: { id: imageId } } );
    if ( !image ) throw new NotFoundException( "Image not found" );
    // Get image sizes and filenames suffixes
    const imageSizesAndSuffixes = Object.keys( ImageSizeCategories )
      .filter( isc => isc !== ImageSizeCategories.ORIGINAL )
      .map( isc => {
        if ( isc !== ImageSizeCategories.ORIGINAL ) {
          return { suffix: isc, size: +isc.split( '_' )[ 1 ] };
        }
      } );
    // Get watermark settings
    let isWatermarkedEnabled = ( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_ACTIVE ) ).value === "true";
    const watermarkImageId = ( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_IMAGE_ID ) ).value;
    // Get watermark file info from database
    const watermarkImage = isWatermarkedEnabled && watermarkImageId
      ? await this.fileRepository.findOne( { where: { id: watermarkImageId } } )
      : null;
    if ( !watermarkImage ) isWatermarkedEnabled = false;

    // Get image file from S3 storage
    const params = {
      Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
      Key: image.key
    };
    const imageFromS3 = await this.s3.getObject( params ).promise();
    await this.s3ObjectExists( params.Key );

    // Get image body as buffer for getting ready to consume by Sharp package
    const imageBuffer = imageFromS3.Body as Buffer;

    // Get image ready to edit with Sharp
    const sharpImg = sharp( imageBuffer );
    // Get image metadata
    const sharpImgMetadata = await sharpImg.metadata();
    // Get image width
    const sharpImgWidth = sharpImgMetadata.width;
    // Get image height
    const sharpImgHeight = sharpImgMetadata.height;

    // Do this if watermark functionality is activated in settings
    if ( isWatermarkedEnabled ) {
      // Get image allowed sizes to watermark
      const sizesToWatermarkStringArr = ( ( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_SIZES ) ).value ).split( ',' );
      const sizesToWatermark = sizesToWatermarkStringArr.length ? sizesToWatermarkStringArr.map( s => +s ) : [];
      // Get watermark file from S3 storage
      const watermarkParams = {
        Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
        Key: watermarkImage.key
      };
      const watermarkFile = await this.s3.getObject( watermarkParams ).promise();
      await this.s3ObjectExists( watermarkParams.Key );

      // Get watermark extra settings
      // Get watermark ratio to original image dimensions
      const watermarkToImageRatio = +( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_TO_IMAGE_DIMENSIONS ) ).value;
      // Get watermark placement
      const watermarkPlacement = ( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_PLACEMENT ) ).value;
      // Get watermark margins
      const wmMarginTop = +( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_MARGINS_TOP ) ).value;
      const wmMarginRight = +( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_MARGINS_RIGHT ) ).value;
      const wmMarginBottom = +( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_MARGINS_BOTTOM ) ).value;
      const wmMarginLeft = +( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_MARGINS_LEFT ) ).value;
      // Get watermark transparency
      const wmTransparencyPercent = +( await this.settingsService.findOne( SettingsKeyEnum.FILE_WATERMARK_OPACITY ) ).value;
      const wmTransparencyValue = Math.ceil( wmTransparencyPercent * 255 / 100 );

      // Get watermark body as buffer and then as sharp type for getting ready to consume by Sharp package
      const watermarkImg = sharp( watermarkFile.Body as Buffer );
      // Get watermark metadata
      const watermarkMeta = await watermarkImg.metadata();
      // Get watermark width
      const watermarkWidth = watermarkMeta.width;
      // Get watermark height
      const watermarkHeight = watermarkMeta.height;

      // Make watermark fit and usable by resizing it if needed
      const finalWatermark = watermarkWidth > ( sharpImgWidth * watermarkToImageRatio )
        ? await watermarkImg.resize( sharpImgWidth * watermarkToImageRatio ).toBuffer()
        : await watermarkImg.toBuffer();

      const finalWatermarkMeta = await sharp( finalWatermark ).metadata();
      const finalWatermarkWidth = finalWatermarkMeta.width;
      const finalWatermarkHeight = finalWatermarkMeta.height;

      // Calculate center and middle of the image and watermark
      const centerToLeft = ( sharpImgWidth / 2 ) - ( finalWatermarkWidth / 2 );
      const middleFromTop = ( sharpImgHeight / 2 ) - ( finalWatermarkHeight / 2 );
      // Calculate right watermark placement from left
      const rightFromLeft = sharpImgWidth - finalWatermarkWidth - wmMarginRight;
      const bottomFromTop = sharpImgHeight - finalWatermarkHeight - wmMarginBottom;

      // Calculate placement of the watermark on image
      const { top, left } = ( (): { top: number, left: number; } => {
        switch ( watermarkPlacement ) {
          case FilesWatermarkPlacementEnum.TOP_LEFT.toString():
            return { top: wmMarginTop, left: wmMarginLeft };
          case FilesWatermarkPlacementEnum.TOP_CENTER.toString():
            return { top: wmMarginTop, left: centerToLeft };
          case FilesWatermarkPlacementEnum.TOP_RIGHT.toString():
            return { top: wmMarginTop, left: rightFromLeft };
          case FilesWatermarkPlacementEnum.MIDDLE.toString():
            return { top: middleFromTop, left: centerToLeft };
          case FilesWatermarkPlacementEnum.BOTTOM_LEFT.toString():
            return { top: bottomFromTop, left: wmMarginLeft };
          case FilesWatermarkPlacementEnum.BOTTOM_CENTER.toString():
            return { top: bottomFromTop, left: centerToLeft };
          case FilesWatermarkPlacementEnum.BOTTOM_RIGHT.toString():
            return { top: bottomFromTop, left: rightFromLeft };

          default:
            return { top: wmMarginTop, left: wmMarginLeft };
        }
      } )();

      // Make watermark transparent
      const transparentWatermark = await sharp( finalWatermark ).composite( [
        {
          input: Buffer.from( [ 0, 0, 0, wmTransparencyValue ] ),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: 'dest-in',
        }
      ] ).toBuffer();

      // Print watermark on original image
      const underWaterImage = await sharpImg.composite( [
        {
          input: transparentWatermark,
          top,
          left
        }
      ] ).toBuffer();

      await Promise.all(
        imageSizesAndSuffixes.map( async iss => {
          if ( sizesToWatermark.includes( iss.size ) ) {
            const resizedImage = sharp( underWaterImage ).resize( iss.size ).jpeg();
            const originalFileExt = path.parse( image.key ).ext;
            const originalFileKey = image.key.slice( 0, -( originalFileExt.length ) );
            const resizedImageKey = `${ originalFileKey }_watermarked_${ iss.suffix }.jpg`;
            const resizedImageName = `${ path.parse( image.filename ).name }_watermarked_${ iss.suffix }.jpg`;
            // Upload new generated image under watermark to S3 storage
            try {
              await this.s3ObjectExists( resizedImageKey );
            } catch ( error ) {
              await this.s3.upload( {
                Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
                Key: resizedImageKey,
                Body: await resizedImage.toBuffer(),
                ContentType: 'image/jpeg',
                ACL: image.policy,
                Metadata: imageFromS3.Metadata
              } ).promise();
            }

            const resizedImageExists = await this.fileRepository.findOne( { where: { key: resizedImageKey } } );
            if ( !resizedImageExists ) {
              // Save new generated image info to the database
              const imageToSave = this.fileRepository.create( {
                originalImage: { id: image.id },
                filename: resizedImageName,
                imageSizeCategory: ImageSizeCategories[ iss.suffix ],
                key: resizedImageKey,
                policy: image.policy,
                section: image.section,
                status: FileStatus.READY,
                size: ( await resizedImage.metadata() ).size,
                type: 'image/jpeg'
              } );

              return this.fileRepository.save( imageToSave );
            }

            return resizedImageExists;
          }

          const resizedImage = sharp( imageBuffer ).resize( iss.size ).jpeg();
          const originalFileExt = path.parse( image.key ).ext;
          const originalFileKey = image.key.slice( 0, -( originalFileExt.length ) );
          const resizedImageKey = `${ originalFileKey }_${ iss.suffix }.jpg`;
          const resizedImageName = `${ path.parse( image.filename ).name }_${ iss.suffix }.jpg`;

          try {
            await this.s3ObjectExists( resizedImageKey );
          } catch ( error ) {
            // Upload new generated image to S3 storage
            await this.s3.upload( {
              Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
              Key: resizedImageKey,
              Body: await resizedImage.toBuffer(),
              ContentType: 'image/jpeg',
              ACL: image.policy,
              Metadata: imageFromS3.Metadata
            } ).promise();
          }

          const resizedImageExists = await this.fileRepository.findOne( { where: { key: resizedImageKey } } );
          if ( !resizedImageExists ) {
            // Save new generated image info to the database
            const imageToSave = this.fileRepository.create( {
              originalImage: { id: image.id },
              filename: resizedImageName,
              imageSizeCategory: ImageSizeCategories[ iss.suffix ],
              key: resizedImageKey,
              policy: image.policy,
              section: image.section,
              status: FileStatus.READY,
              size: ( await resizedImage.metadata() ).size,
              type: 'image/jpeg'
            } );

            return this.fileRepository.save( imageToSave );
          }

          return resizedImageExists;
        } )
      );

      image.status = FileStatus.READY;
      return this.fileRepository.save( image );
    }

    await Promise.all(
      imageSizesAndSuffixes.map( async iss => {

        const resizedImage = sharp( imageBuffer ).resize( iss.size ).jpeg();
        const originalFileExt = path.parse( image.key ).ext;
        const originalFileKey = image.key.slice( 0, -( originalFileExt.length ) );
        const resizedImageKey = `${ originalFileKey }_${ iss.suffix }.jpg`;
        const resizedImageName = `${ path.parse( image.filename ).name }_${ iss.suffix }.jpg`;

        try {
          await this.s3ObjectExists( resizedImageKey );
        } catch ( error ) {
          // Upload new generated image to S3 storage
          await this.s3.upload( {
            Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
            Key: resizedImageKey,
            Body: await resizedImage.toBuffer(),
            ContentType: 'image/jpeg',
            ACL: image.policy,
            Metadata: imageFromS3.Metadata
          } ).promise();
        }

        const resizedImageExists = await this.fileRepository.findOne( { where: { key: resizedImageKey } } );
        if ( !resizedImageExists ) {
          // Save new generated image info to the database
          const imageToSave = this.fileRepository.create( {
            originalImage: { id: image.id },
            filename: resizedImageName,
            imageSizeCategory: ImageSizeCategories[ iss.suffix ],
            key: resizedImageKey,
            policy: image.policy,
            section: image.section,
            status: FileStatus.READY,
            size: ( await resizedImage.metadata() ).size,
            type: 'image/jpeg'
          } );

          return this.fileRepository.save( imageToSave );
        }

        return resizedImageExists;
      } )
    );

    image.status = FileStatus.READY;
    return this.fileRepository.save( image );
  }

  // Configure S3 CORS
  async configS3CORS () {
    const cors = {
      Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ), // REQUIRED
      CORSConfiguration: {
        // REQUIRED
        CORSRules: [
          // REQUIRED
          {
            AllowedHeaders: [
              "Authorization",
              "x-amz-date",
              "x-amz-content-sha256",
              "content-type"
            ],
            ExposeHeaders: [ "ETag" ],
            AllowedMethods: [ 'POST', 'GET', 'PUT' ], // REQUIRED
            AllowedOrigins: this.configService.getOrThrow( EnvEnum.S3_ALLOWED_ORIGINS ).split( ',' ), // REQUIRED
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };

    return this.s3.putBucketCors( cors ).promise();
  }

  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  /**
   * Check to see if S3 object is existed or throws an error
   * 
   * @param key - Object key
   * @param i18n - (Optional) I18n object for translation errors
   * @returns A Promise containing a response or throw an error
   */
  async s3ObjectExists ( key: string, i18n?: I18nContext ) {
    const params = {
      Bucket: this.configService.getOrThrow( EnvEnum.S3_BUCKET ),
      Key: key
    };
    try {
      const output = await this.s3.headObject( params ).promise();
      return output;
    } catch ( error ) {
      if ( error.name === 'NotFound' ) {
        if ( i18n ) {
          throw new NotFoundLocalizedException( i18n, FilesInfoLocale.TERM_FILE );
        }
        throw new NotFoundException( 'S3 object not found' );
      } else {
        if ( i18n ) {
          throw new BadRequestException( i18n.t( CommonErrorsLocale.Bad_Request ) );
        }
        throw new BadRequestException( 'Something went wrong finding S3 object' );
      }
    }
  }

  /**
   * Delete a single S3 object
   * 
   * @param params - An object of the type {@link S3Type.DeleteObjectRequest}
   * @returns A Promise of PromiseResult `<S3Type.DeleteObjectOutput, AWSError>`
   */
  s3DeleteObject ( params: S3Type.DeleteObjectRequest ) {
    return this.s3.deleteObject( params ).promise();
  }

  /**
   * Delete multiple S3 objects
   * 
   * @param params - An object of the type {@link S3Type.DeleteObjectsRequest}
   * @returns A Promise of PromiseResult `<S3Type.DeleteObjectsOutput, AWSError>`
   */
  s3DeleteMultipleObjects ( params: S3Type.DeleteObjectsRequest ) {
    return this.s3.deleteObjects( params ).promise();
  }

  /************************ Uppy Companion Config Helper Methods ***************************/
  /************************************ Start Region ***************************************/
  /*****************************************************************************************/

  // Using wildcards to check if the provided string fulfills the rules 
  matchRules ( str: string, rule: string ) {
    const escapeRegexp = ( str: string ) => str.replace( /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1" );
    return new RegExp( "^" + rule.split( "*" ).map( escapeRegexp ).join( ".*" ) + "$" ).test( str );
  };

  // Check filetype based on its mimetype by using wildcards 
  isFileTypeAllowed ( mimeType: string, allowedTypes: string[] ): boolean {
    for ( let i = 0; i < allowedTypes.length; i++ ) {
      const isMatched = this.matchRules( mimeType, allowedTypes[ i ] );
      if ( isMatched ) return true;
    }

    return false;
  };

  // Default Allowed Types of Uploading Files Through Uppy Companion
  private readonly defaultAllowedTypes = [
    'video/*',
    'image/*',
    'application/pdf',
    'application/epub+zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    'application/zip',
    'application/vnd.rar',
    'application/x-7z-compressed'
  ];

  // Path generator for uploading file through uppy companion
  pathGeneratorBySection ( section: FileSectionEnum ) {
    switch ( section ) {
      case FileSectionEnum.BLOG:
        return 'blog';
      case FileSectionEnum.BRAND_LOGO:
        return 'brand_logo';
      case FileSectionEnum.COURSE:
        return 'course';
      case FileSectionEnum.MAIN_SLIDESHOW:
        return 'main_slideshow';
      case FileSectionEnum.NEWS:
        return 'news';
      case FileSectionEnum.PRODUCT:
        return 'product';
      case FileSectionEnum.SITE_LOGO:
        return 'site_logo';
      case FileSectionEnum.USER:
        return 'user';
      default:
        return 'miscellaneous';
    }
  }

  /**
   * Get AWS S3 Config Params.
   *
   * @function getS3ConfigParams
   * @param {number} expiresInSeconds - Upload link expiration time in seconds.
   * @param {string[]} allowedMimeTypes - Allowed mime types.
   * @return {object} The object of S3 config params.
   */
  getS3ConfigParams (
    expiresInSeconds: number = 1 * 60 * 60,
    allowedMimeTypes: string[] = this.defaultAllowedTypes ): object {

    return this.s3BucketConfig( this.configService, expiresInSeconds, allowedMimeTypes );
  };

  // Filename Generator
  fileNameGenerator ( params: IFileNameGeneratorParams ) {
    const { metadata, allowedMimeTypes } = params;
    if ( !Object.values( FileSectionEnum ).includes( metadata.section ) ) {
      console.log( "Something went wrong generating filename" );
      throw new BadRequestException( { code: 4001, message: "Something went wrong generating filename" } );
    }
    const rawFileName = path.parse( metadata.name ).name;
    const fileExt = path.parse( metadata.name ).ext;
    const rootFolderName = metadata.access === FilePolicyEnum.PRIVATE
      ? "private"
      : "public";
    // Sanitizing 
    const sanitizedFileName = sanitize.addUnderscore( rawFileName );
    // Check for file type 
    const isTypeAllowed = this.isFileTypeAllowed( metadata.type, allowedMimeTypes );
    if ( !isTypeAllowed ) {
      console.log( "File type not allowed" );
      throw new BadRequestException( { code: 4002, message: "File type not allowed" } );
    }
    // Compute full filename
    const fullFileName = `${ rootFolderName }/${ this.pathGeneratorBySection( metadata.section ) }/${ sanitizedFileName }_${ Date.now() }${ fileExt }`;
    return fullFileName;
  };

  // S3 Private Bucket Params
  s3BucketConfig ( configService: ConfigService, expiresInSeconds: number, allowedMimeTypes: string[] ) {
    return {
      providerOptions: {
        // Instagram, Facebook, OneDrive, DriveBox, Drive
      },
      s3: {
        getKey: ( req: any, filename: any, metadata: any ) => {
          return this.fileNameGenerator( {
            allowedMimeTypes,
            metadata,
          } );
        },
        key: configService.getOrThrow( EnvEnum.S3_ACCESS_KEY ),
        secret: configService.getOrThrow( EnvEnum.S3_SECRET_KEY ),
        bucket: configService.getOrThrow( EnvEnum.S3_BUCKET ),
        region: configService.getOrThrow( EnvEnum.S3_REGION ),
        useAccelerateEndpoint: false, // default: false,
        expires: expiresInSeconds, // default: 300 (5 minutes)
        acl: configService.getOrThrow( EnvEnum.S3_ACL ), // default: public-read
        awsClientOptions: {
          endpoint: configService.getOrThrow( EnvEnum.S3_ENDPOINT ),
          s3ForcePathStyle: configService.getOrThrow( EnvEnum.S3_FORTH_PATH_STYLE ) === "true"
        }
      },
      server: {
        host: `${ this.configService.getOrThrow( EnvEnum.SITE_HOST ) }:${ this.configService.getOrThrow( EnvEnum.SITE_PORT ) }`,
        protocol: configService.getOrThrow( EnvEnum.SITE_PROTOCOL ),
        // This MUST match the path you specify in `app.use()` below:
        path: configService.getOrThrow( EnvEnum.UPLOAD_ROUTE ),
      },
      redisUrl: configService.getOrThrow( EnvEnum.REDIS_URL ),
      redisPubSubScope: "companion_server",
      debug: configService.getOrThrow( EnvEnum.NODE_ENV ) === 'development',
      secret: configService.getOrThrow( EnvEnum.AUTH_ACCESS_TOKEN_SECRET ),
      filePath: path.join( __dirname, '../../public' ),
      streamingUpload: configService.getOrThrow( EnvEnum.S3_STREAMING_UPLOAD ) === "true",
      uploadUrls: [ configService.getOrThrow( EnvEnum.S3_ENDPOINT ) ],
    };
  };

  /************************************* End Region ****************************************/
  /************************ Uppy Companion Config Helper Methods ***************************/
  /*****************************************************************************************/



  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}