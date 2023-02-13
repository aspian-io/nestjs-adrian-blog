import { Module } from '@nestjs/common';
import { TaxonomiesService } from './taxonomies.service';
import { TaxonomiesController } from './taxonomies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taxonomy } from './entities/taxonomy.entity';
import { TaxonomySlugsHistory } from './entities/taxonomy-slug.entity';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ Taxonomy, TaxonomySlugsHistory ] ),
  ],
  controllers: [ TaxonomiesController ],
  providers: [ TaxonomiesService ],
  exports: [ TypeOrmModule, TaxonomiesService ]
} )
export class TaxonomiesModule { }
