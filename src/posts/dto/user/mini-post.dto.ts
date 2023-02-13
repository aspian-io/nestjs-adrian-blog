import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Expose, Type } from "class-transformer";
import { PostDto } from "./post.dto";

export class MiniPostDto extends PartialType( OmitType( PostDto, [ 'content', 'ancestor', 'child', 'parent' ] as const ) ) {
  @Expose()
  @Type( () => MiniPostDto )
  ancestor: MiniPostDto;

  @Expose()
  @Type( () => MiniPostDto )
  child: MiniPostDto;

  @Expose()
  @Type( () => MiniPostDto )
  parent: MiniPostDto;
}