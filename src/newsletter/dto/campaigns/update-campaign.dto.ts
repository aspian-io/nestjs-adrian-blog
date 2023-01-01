import { OmitType, PartialType } from "@nestjs/mapped-types";
import { NewsletterCreateCampaignDto } from "./create-campain.dto";

export class NewsletterUpdateCampaignDto extends PartialType( OmitType( NewsletterCreateCampaignDto, [ 'templateDesign' ] as const ) ) { }