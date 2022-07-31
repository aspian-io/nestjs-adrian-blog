import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { File } from 'src/files/entities/file.entity';
import { TaxonomiesErrorsLocale } from 'src/i18n/locale-keys/taxonomies/errors.locale';
import { TaxonomiesInfoLocale } from 'src/i18n/locale-keys/taxonomies/info.locale';
import { Not, Repository } from 'typeorm';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { TaxonomiesListQueryDto } from './dto/taxonomy-list-query.dto';
import { UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
import { Taxonomy, TaxonomyTypeEnum } from './entities/taxonomy.entity';

@Injectable()
export class TaxonomiesService {
  constructor (
    @InjectRepository( Taxonomy ) private readonly taxonomyRepository: Repository<Taxonomy>,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache,
  ) { }

  // Create a new taxonomy
  async create (
    createTaxonomyDto: CreateTaxonomyDto,
    i18n: I18nContext,
    metadata: IMetadataDecorator ): Promise<Taxonomy> {
    const { type, term, slug } = createTaxonomyDto;

    // Check for taxonomy duplication
    await this.checkTaxonomyDuplication( type, term, i18n );

    // Check for taxonomy's slug duplication
    await this.checkTaxonomySlugDuplication( type, slug, i18n );

    // Create taxonomy
    const taxonomy = this.taxonomyRepository.create( {
      ...createTaxonomyDto,
      featuredImage: { id: createTaxonomyDto.featuredImageId },
      parent: { id: createTaxonomyDto.parentId },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    } );

    const result = await this.taxonomyRepository.save( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Find all taxonomies and search and filter and pagination
  async findAll ( query: TaxonomiesListQueryDto, type?: TaxonomyTypeEnum ): Promise<IListResultGenerator<Taxonomy>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // Get the result from database
    const [ items, totalItems ] = await this.taxonomyRepository.findAndCount( {
      where: {
        type,
        term: query[ 'searchBy.term' ],
        description: query[ 'searchBy.description' ],
      },
      order: {
        term: query[ 'orderBy.term' ],
        description: query[ 'orderBy.description' ],
        createdAt: query[ 'orderBy.createdAt' ],
        updatedAt: query[ 'orderBy.updatedAt' ],
        ipAddress: query[ 'orderBy.ipAddress' ],
        userAgent: query[ 'orderBy.userAgent' ],
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find a taxonomy
  async findOne ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Taxonomy> {
    const taxonomy = await this.taxonomyRepository.findOne( {
      where: { id },
      relations: {
        parent: true,
        children: true,
      },
      withDeleted
    } );

    if ( !taxonomy ) throw new NotFoundLocalizedException( i18n, TaxonomiesInfoLocale.TERM_TAXONOMY );
    return taxonomy;
  }

  // Update a taxonomy
  async update (
    id: string,
    updateTaxonomyDto: UpdateTaxonomyDto,
    i18n: I18nContext,
    metadata: IMetadataDecorator ): Promise<Taxonomy> {
    // Find Taxonomy
    const taxonomy = await this.findOne( id, i18n );

    // Check for taxonomy duplication
    const duplicateTaxonomy = await this.taxonomyRepository.findOne( {
      where: {
        type: taxonomy.type,
        term: updateTaxonomyDto.term
      }
    } );
    // Throw taxonomy duplication error
    if ( duplicateTaxonomy ) throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY ) );

    // Check for slug duplication
    const duplicateTaxonomySlug = await this.taxonomyRepository.findOne( {
      where: {
        id: Not( taxonomy.id ),
        slug: updateTaxonomyDto.slug
      }
    } );
    // Throw slug duplication error
    if ( duplicateTaxonomySlug ) {
      throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY_SLUG ) );
    }

    // Assign update dto to original taxonomy object
    Object.assign( taxonomy, updateTaxonomyDto );

    updateTaxonomyDto?.parentId
      ? taxonomy.parent = { id: updateTaxonomyDto.parentId } as Taxonomy
      : taxonomy.parent = null;

    if ( updateTaxonomyDto?.featuredImageId ) {
      updateTaxonomyDto?.featuredImageId
        ? taxonomy.featuredImage = { id: updateTaxonomyDto.featuredImageId } as File
        : taxonomy.featuredImage = null;
    }

    taxonomy.ipAddress = metadata.ipAddress;
    taxonomy.userAgent = metadata.userAgent;

    const result = await this.taxonomyRepository.save( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Soft remove a taxonomy
  async softRemove ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n );

    const result = await this.taxonomyRepository.softRemove( taxonomy );
    await this.cacheManager.reset();
    return result;
  }

  // Recover a soft-removed taxonomy
  async recover ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n );

    const result = await this.taxonomyRepository.recover( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Remove a taxonomy permanently
  async remove ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n );

    const result = await this.taxonomyRepository.remove( taxonomy );
    await this.cacheManager.reset();

    return result;
  }



  /********************************************************************************************/
  /********************************** Helper Methods ******************************************/
  /*********************************** Start Region *******************************************/
  /********************************************************************************************/

  // Check taxonomy duplication
  async checkTaxonomyDuplication ( taxonomyType: TaxonomyTypeEnum, taxonomyMetaTerm: string, i18n: I18nContext ): Promise<void> {
    // Check for taxonomy duplication
    const duplicateTaxonomy = await this.taxonomyRepository.findOne( {
      where: {
        type: taxonomyType,
        term: taxonomyMetaTerm
      }
    } );
    // Throw taxonomy duplication error
    if ( duplicateTaxonomy ) throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY ) );
  }

  // Check taxonomy slug duplication
  async checkTaxonomySlugDuplication ( taxonomyType: TaxonomyTypeEnum, taxonomyMetaSlug: string, i18n: I18nContext ): Promise<void> {
    // Check for taxonomy's slug duplication
    const duplicateSlug = await this.taxonomyRepository.findOne( {
      where: {
        type: taxonomyType,
        slug: taxonomyMetaSlug
      }
    } );
    // Throw slug duplication error
    if ( duplicateSlug ) throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY_SLUG ) );
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}
