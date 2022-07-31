import * as bcrypt from 'bcrypt';
import { PermissionsEnum } from '../security/permissions.enum';

export const userData = async () => [
  {
    username: 'admin@test.com',
    email: 'admin@test.com',
    password: await bcrypt.hash( '123456', 10 ),
    firstName: "John",
    lastName: "Doe",
    bio: "I am a webmaster",
    claims: []
  },
  {
    username: 'aspianet.io@gmail.com',
    email: 'aspianet.io@gmail.com',
    password: await bcrypt.hash( '123456', 10 ),
    firstName: "Jane",
    lastName: "Doe",
    bio: "I am a webmaster too",
    claims: []
  },
  {
    username: 'user@test.com',
    email: 'user@test.com',
    password: await bcrypt.hash( '123456', 10 ),
    firstName: "Mark",
    lastName: "Doe",
    bio: "I am an ordinary user of the website",
    claims: []
  }
];