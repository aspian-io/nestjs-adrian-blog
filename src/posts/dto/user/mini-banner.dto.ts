import { PickType } from "@nestjs/mapped-types";
import { PostDto } from "./post.dto";

export class MiniBannerDto extends PickType( PostDto, [ 'content' ] as const ) { }