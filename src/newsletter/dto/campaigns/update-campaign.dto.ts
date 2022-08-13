import { PartialType } from "@nestjs/mapped-types";
import { NewsletterCreateCampaignDto } from "./create-campain.dto";

export class NewsletterUpdateCampaignDto extends PartialType( NewsletterCreateCampaignDto ) { }