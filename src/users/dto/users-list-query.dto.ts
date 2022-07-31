import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { PermissionsEnum } from "src/common/security/permissions.enum";
import { QueryStringUtil } from "src/common/utils/query-string.utils";
import { FindOperator } from "typeorm";

type OrderType = 'ASC' | 'DESC';

export class UsersListQueryDto {
  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.email"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.firstName"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.lastName"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.bio"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.address"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.phone"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.mobilePhone"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractSearchString( value ) )
  @IsOptional()
  "searchBy.postalCode"?: FindOperator<string>;

  @Transform( ( { value } ) => QueryStringUtil.extractValuesListBasedOn( value, Object.values( PermissionsEnum ) ) )
  @IsOptional()
  "filterBy.claims"?: string[];

  @Transform( ( { value } ) => QueryStringUtil.toBoolean( value ) )
  @IsOptional()
  "filterBy.suspended"?: boolean;

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.birthDate"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.createdAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractCommaSeparatedDateRange( value ) )
  @IsOptional()
  "filterBy.updatedAt"?: Date[];

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.email"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.birthDate"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.country"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.state"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.city"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.address"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.phone"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.mobilePhone"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.postalCode"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.createdAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.updatedAt"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.suspend"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.ipAddress"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.userAgent"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.firstName"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.lastName"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractOrder( value ) )
  @IsOptional()
  "orderBy.bio"?: OrderType;

  @Transform( ( { value } ) => QueryStringUtil.extractPage( value ) )
  @IsOptional()
  page?: number = 1;

  @Transform( ( { value } ) => QueryStringUtil.extractLimit( value ) )
  @IsOptional()
  limit?: number = 10;
}