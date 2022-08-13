import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Setting } from "./settings/entities/setting.entity";
import { User } from "./users/entities/user.entity";
import * as chalk from 'chalk';
import { ConfigService } from "@nestjs/config";
import { settingsData } from "./common/seeding-data/settings.data";
import { userData } from "./common/seeding-data/users.data";
import { Claim } from "./users/entities/claim.entity";
import { claimData } from "./common/seeding-data/user-claims.data";
import { PermissionsEnum } from "./common/security/permissions.enum";
import { File } from "./files/entities/file.entity";
import { Taxonomy } from "./taxonomies/entities/taxonomy.entity";
import { Post } from "./posts/entities/post.entity";
import { Comment } from "./comments/entities/comment.entity";

@Injectable()
export class AppSeederService {
  constructor (
    @InjectRepository( Setting ) private settingsRepository: Repository<Setting>,
    @InjectRepository( User ) private userRepository: Repository<User>,
    @InjectRepository( Claim ) private claimRepository: Repository<Claim>,
    @InjectRepository( File ) private fileRepository: Repository<File>,
    @InjectRepository( Taxonomy ) private taxonomyRepository: Repository<Taxonomy>,
    @InjectRepository( Post ) private postRepository: Repository<Post>,
    @InjectRepository( Comment ) private commentRepository: Repository<Comment>,
    private configService: ConfigService
  ) { }

  async insertMany () {
    try {
      // Settings
      await this.settingsRepository.insert( settingsData( this.configService ) );
      // Claims
      await this.claimRepository.insert( claimData );
      const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
      // Users
      const usersList = await userData();
      usersList[ 0 ].claims.push( adminClaim );
      usersList[ 1 ].claims.push( adminClaim );
      await Promise.all( usersList.map( async ( user ) => {
        const createdUser = this.userRepository.create( user );
        await this.userRepository.save( createdUser );
      } ) );

      console.log( chalk.bold.green( "Data imported successfully!" ) );
      process.exit();
    } catch ( error ) {
      console.log( chalk.red.inverse( "Something went wrong importing data into the database, ", error ) );
      process.exit( 1 );
    }
  }

  async deleteMany () {
    try {
      // Posts
      await this.postRepository.delete( {} );
      // Taxonomies
      await this.taxonomyRepository.delete( {} );
      // Files
      await this.fileRepository.delete( {} );
      // Claims
      await this.claimRepository.delete( {} );
      // Settings
      await this.settingsRepository.delete( {} );
      // User
      await this.userRepository.delete( {} );

      console.log( chalk.bold.red( "Data destroyed successfully!" ) );
      process.exit();
    } catch ( error ) {
      console.log( chalk.red.inverse( "Something went wrong clearing the database, " ), error );
      process.exit( 1 );
    }
  }
}