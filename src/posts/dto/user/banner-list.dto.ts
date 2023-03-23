import { Expose, Type } from "class-transformer";
import { MiniBannerDto } from "./mini-banner.dto";

export class BannerListDto {
  @Expose()
  meta: any;

  @Expose()
  @Type( () => MiniBannerDto )
  items: MiniBannerDto[];
}