import { Module } from '@nestjs/common';
import { TaxonomiesService } from './taxonomies.service';
import { TaxonomiesController } from './taxonomies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taxonomy } from './entities/taxonomy.entity';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ Taxonomy ] ),
  ],
  controllers: [ TaxonomiesController ],
  providers: [ TaxonomiesService ],
} )
export class TaxonomiesModule { }
