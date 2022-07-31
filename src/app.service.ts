import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AppSeederService } from './app-seeder.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor ( private seederService: AppSeederService ) { }

  onApplicationBootstrap () {
    // Seeding data
    if ( process.env.DATA_IMPORT && process.env.DATA_IMPORT === "1" ) {
      this.seederService.insertMany();
    }

    // Clearing data
    if ( process.env.DATA_DESTROY && process.env.DATA_DESTROY === "1" ) {
      this.seederService.deleteMany();
    }
  }
  getHello (): string {
    return 'Hello World!';
  }
}
