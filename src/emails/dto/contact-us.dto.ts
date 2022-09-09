import { PickType } from "@nestjs/mapped-types";
import { SendEmailDto } from "./send-email.dto";

export class EmailContactUsDto extends PickType( SendEmailDto, [ 'from', 'subject', 'priority', 'html' ] as const ) { }