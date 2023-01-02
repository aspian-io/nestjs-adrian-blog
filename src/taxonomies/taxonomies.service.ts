import { BadRequestException, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { I18nContext } from 'nestjs-i18n';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { TaxonomiesErrorsLocale } from 'src/i18n/locale-keys/taxonomies/errors.locale';
import { TaxonomiesInfoLocale } from 'src/i18n/locale-keys/taxonomies/info.locale';
import { FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { TaxonomiesListQueryDto } from './dto/taxonomy-list-query.dto';
import { UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
import { TaxonomySlugsHistory } from './entities/taxonomy-slug.entity';
import { Taxonomy, TaxonomyTypeEnum } from './entities/taxonomy.entity';
import { ITaxonomyReturnFindBySlug, TaxonomyErrorsEnum, TaxonomyErrorsInternalCodeEnum } from './types/service.type';

@Injectable()
export class TaxonomiesService {
  // Allowed level of taxonomies subitems
  // Before apply any changes to this number first you should adjust findOne and findAll method in this service
  private readonly allowedSubitemLevel: number = 5;

  constructor (
    @InjectRepository( Taxonomy ) private readonly taxonomyRepository: Repository<Taxonomy>,
    @InjectRepository( TaxonomySlugsHistory ) private readonly taxonomySlugsHistoryRepository: Repository<TaxonomySlugsHistory>,
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

    const parent = createTaxonomyDto.parentId ? await this.findOne( createTaxonomyDto.parentId, i18n ) : null;
    const childLevel = parent ? parent.childLevel + 1 : 0;

    if ( childLevel > this.allowedSubitemLevel )
      throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.FORBIDDEN_CHILD_LEVEL, { args: { levelNumber: this.allowedSubitemLevel } } ) );

    // Create taxonomy
    const taxonomy = this.taxonomyRepository.create( {
      ...createTaxonomyDto,
      parent,
      childLevel,
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

    const where: FindOptionsWhere<Taxonomy> = {
      type,
      term: query[ 'searchBy.term' ],
      description: query[ 'searchBy.description' ],
      slug: query[ 'searchBy.slug' ],
    };

    if ( !query[ 'searchBy.term' ] && !query[ 'searchBy.description' ] && !query[ 'searchBy.slug' ] ) where.parent = IsNull();

    // Get the result from database
    const [ items, totalItems ] = await this.taxonomyRepository.findAndCount( {
      relations: {
        parent: true,
        // Based on allowed subitems number (5 children)
        children: {
          children: {
            children: {
              children: {
                children: true
              }
            }
          }
        },
        slugsHistory: true
      },
      where,
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

  // Find all menu items
  findAllMenuItems ( menuId: string ): Promise<Taxonomy[]> {
    return this.taxonomyRepository.find( {
      relations: {
        parent: true,
        // Based on allowed subitems number (5 children)
        children: {
          children: {
            children: {
              children: {
                children: true
              }
            }
          }
        },
        slugsHistory: true
      },
      where: {
        parent: { id: menuId },
        type: TaxonomyTypeEnum.MENU_ITEM
      },
      order: {
        order: { direction: 'ASC' },
        children: {
          order: {
            direction: 'ASC',
          }
        }
      },
    } );
  }

  // Find a taxonomy
  async findOne ( id: string, i18n: I18nContext, withDeleted: boolean = false ): Promise<Taxonomy> {
    const taxonomy = await this.taxonomyRepository.findOne( {
      where: { id },
      relations: {
        parent: true,
        // Based on allowed subitems number (5 children)
        children: {
          children: {
            children: {
              children: {
                children: true
              }
            }
          }
        },
        slugsHistory: true
      },
      withDeleted
    } );

    if ( !taxonomy ) throw new NotFoundLocalizedException( i18n, TaxonomiesInfoLocale.TERM_TAXONOMY );
    return taxonomy;
  }

  // Find a taxonomy by slug
  async findBySlug ( slug: string, i18n: I18nContext, type?: TaxonomyTypeEnum ): Promise<ITaxonomyReturnFindBySlug> {
    const taxonomy = await this.taxonomyRepository.findOne( {
      relations: {
        // Based on allowed subitems number (5 children)
        children: {
          children: {
            children: {
              children: {
                children: true
              }
            }
          }
        },
        parent: true,
        slugsHistory: true
      },
      where: {
        slug,
        type
      }
    } );
    if ( !taxonomy ) {
      const taxonomyWithOldSlug = await this.taxonomyRepository.findOne( {
        relations: {
          parent: true,
          slugsHistory: true
        },
        where: {
          slugsHistory: { slug },
          type
        }
      } );
      if ( !taxonomyWithOldSlug ) throw new NotFoundLocalizedException( i18n, TaxonomiesInfoLocale.TERM_TAXONOMY );

      return { taxonomy: taxonomyWithOldSlug, redirect: { status: 301 } };
    }

    return { taxonomy };
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
        id: Not( taxonomy.id ),
        type: taxonomy.type,
        term: updateTaxonomyDto.term
      }
    } );
    // Throw taxonomy duplication error
    if ( duplicateTaxonomy ) throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY, { args: { levelNumber: 5 } } ) );

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

    if ( updateTaxonomyDto.slug !== taxonomy.slug ) {
      const slugHistory = this.taxonomySlugsHistoryRepository.create( {
        slug: taxonomy.slug,
        taxonomy: { id: taxonomy.id },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent
      } );

      taxonomy.slugsHistory = [ ...taxonomy.slugsHistory, slugHistory ];
    }

    // Assign update dto to original taxonomy object
    Object.assign( taxonomy, updateTaxonomyDto );

    const parent = updateTaxonomyDto?.parentId ? await this.findOne( updateTaxonomyDto.parentId, i18n ) : null;

    taxonomy.parent = parent ? parent : taxonomy.parent;
    const childLevel = parent ? parent.childLevel + 1 : 0;

    if ( childLevel > this.allowedSubitemLevel )
      throw new BadRequestException( i18n.t( TaxonomiesErrorsLocale.FORBIDDEN_CHILD_LEVEL, { args: { levelNumber: this.allowedSubitemLevel } } ) );

    taxonomy.childLevel = childLevel;

    taxonomy.ipAddress = metadata.ipAddress;
    taxonomy.userAgent = metadata.userAgent;

    const result = await this.taxonomyRepository.save( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Delete a slug history
  async removeOldSlug ( slugId: string, i18n: I18nContext ) {
    const slug = await this.taxonomySlugsHistoryRepository.findOne( { where: { id: slugId } } );
    if ( !slug ) throw new NotFoundLocalizedException( i18n, TaxonomiesInfoLocale.TERM_TAXONOMY_OLD_SLUG );

    const result = await this.taxonomySlugsHistoryRepository.remove( slug );
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

  // Soft remove taxonomies
  async softRemoveAll ( ids: string[] ): Promise<Taxonomy[]> {
    const taxonomies = await this.taxonomyRepository.find( { where: { id: In( ids ) } } );

    const result = await this.taxonomyRepository.softRemove( taxonomies );
    await this.cacheManager.reset();
    return result;
  }

  // Find all soft-removed items
  async softRemovedFindAll ( query: PaginationDto, type: TaxonomyTypeEnum ): Promise<IListResultGenerator<Taxonomy>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    const [ items, totalItems ] = await this.taxonomyRepository.findAndCount( {
      relations: {
        parent: true,
        // Based on allowed subitems number (5 children)
        children: {
          children: {
            children: {
              children: {
                children: true
              }
            }
          }
        },
        slugsHistory: true
      },
      withDeleted: true,
      where: { deletedAt: Not( IsNull() ), type },
      order: { deletedAt: { direction: 'DESC' } },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Recover a soft-removed taxonomy
  async recover ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n, true );

    const result = await this.taxonomyRepository.recover( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Recover soft-removed taxonomies
  async recoverAll ( ids: string[] ): Promise<Taxonomy[]> {
    const taxonomies = await this.taxonomyRepository.find( { where: { id: In( ids ) }, withDeleted: true } );

    const result = await this.taxonomyRepository.recover( taxonomies );
    await this.cacheManager.reset();

    return result;
  }

  // Remove a taxonomy permanently
  async remove ( id: string, i18n: I18nContext ): Promise<Taxonomy> {
    const taxonomy = await this.findOne( id, i18n, true );

    const result = await this.taxonomyRepository.remove( taxonomy );
    await this.cacheManager.reset();

    return result;
  }

  // Remove taxonomies permanently
  async removeAll ( ids: string[] ): Promise<Taxonomy[]> {
    const taxonomies = await this.taxonomyRepository.find( { where: { id: In( ids ) }, withDeleted: true } );

    const result = await this.taxonomyRepository.remove( taxonomies );
    await this.cacheManager.reset();

    return result;
  }

  // Empty trash
  async emptyTrash ( type: TaxonomyTypeEnum ): Promise<void> {
    const softDeletedTaxonomies = await this.taxonomyRepository.find( {
      where: { deletedAt: Not( IsNull() ), type },
      withDeleted: true
    } );

    await this.taxonomyRepository.remove( softDeletedTaxonomies );
    await this.cacheManager.reset();
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
    if ( duplicateTaxonomy ) throw new BadRequestException( {
      statusCode: 400,
      internalCode: TaxonomyErrorsInternalCodeEnum.DUPLICATE_TAXONOMY,
      message: i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY ),
      error: TaxonomyErrorsEnum.DUPLICATE_TAXONOMY
    } );
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
    if ( duplicateSlug ) throw new BadRequestException( {
      statusCode: 400,
      internalCode: TaxonomyErrorsInternalCodeEnum.DUPLICATE_SLUG,
      message: i18n.t( TaxonomiesErrorsLocale.DUPLICATE_TAXONOMY_SLUG ),
      error: TaxonomyErrorsEnum.DUPLICATE_SLUG
    } );
  }

  /********************************************************************************************/
  /************************************ End Region ********************************************/
  /********************************** Helper Methods ******************************************/
  /********************************************************************************************/
}
