import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IUnitOfWork } from '../../../../shared/application/ports/unit-of-work';
import { transactionContext } from '../../../../database/transaction-context';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  execute<T>(work: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      transactionContext.run(manager, work),
    );
  }
}
