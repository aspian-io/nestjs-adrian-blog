import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { SendingIntervalEnum, SendingTypeEnum } from "src/newsletter/entities/newsletter-campaign.entity";
import { FindOperator } from "typeorm";

type OrderType = 'ASC' | 'DESC';

export class NewsletterCampaignListQueryDto {
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.name"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.description"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.emailSubject"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.toNumber( value ) )
  @IsOptional()
  "filterBy.sendingFailedTrackingNumGte"?: number;

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.sendingTime"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.createdAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.updatedAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.name"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.description"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.emailSubject"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.sendingTime"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.createdAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.updatedAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}