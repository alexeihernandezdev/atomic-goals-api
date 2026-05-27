import { Injectable } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { IPasswordHasher } from '../../domain/ports/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly COST = 12;

  hash(plain: string): Promise<string> {
    return hash(plain, this.COST);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
