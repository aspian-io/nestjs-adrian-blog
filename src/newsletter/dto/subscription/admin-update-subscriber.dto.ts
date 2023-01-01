import { PartialType } from "@nestjs/mapped-types";
import { AdminCreateSubscriberDto } from "./admin-create-subscriber.dto";

export class AdminUpdateSubscriberDto extends PartialType( AdminCreateSubscriberDto ) { }