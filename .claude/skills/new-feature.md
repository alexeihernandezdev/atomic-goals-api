# Crear nuevo feature — Clean Architecture (NestJS)

Sigue estos pasos en orden para crear un módulo completo en `src/modules/<feature>/`.
Cada paso corresponde a una capa. No mezcles responsabilidades entre capas.

## Paso 1 — Domain

Crea `src/modules/<feature>/domain/`:

```ts
// entities/<feature>.entity.ts  — PURO, sin decoradores, sin imports de NestJS/TypeORM
export class Feature {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _name: string,
    // ... resto de props
  ) {}

  static create(props: CreateFeatureProps): Feature {
    // Validar invariantes aquí con lanzamiento de DomainError si fallan
    if (!props.name) throw new ValidationError('name is required');
    return new Feature(props.id ?? generateUuid(), props.userId, props.name);
  }

  // Métodos de mutación con invariantes
  rename(newName: string): void {
    if (!newName) throw new ValidationError('name cannot be empty');
    this._name = newName;
  }

  get name() { return this._name; }
}
```

```ts
// ports/<feature>.repository.ts  — interface (output port)
export interface IFeatureRepository {
  findById(id: string, userId: string): Promise<Feature | null>;
  findAllByUser(userId: string): Promise<Feature[]>;
  save(feature: Feature): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
```

```ts
// errors/<feature>-not-found.error.ts
import { NotFoundError } from '@/shared/domain/errors/not-found.error';
export class FeatureNotFoundError extends NotFoundError {
  constructor(id: string) { super(`Feature ${id} not found`); }
}
```

## Paso 2 — Application (commands + use cases)

Crea `src/modules/<feature>/application/`:

```ts
// commands/create-<feature>.command.ts
export interface CreateFeatureCommand {
  userId: string;
  name: string;
  // ... campos del negocio, nunca props HTTP
}
```

```ts
// use-cases/create-<feature>.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { FEATURE_TOKENS } from '../../infrastructure/<feature>.tokens';

@Injectable()
export class CreateFeatureUseCase {
  constructor(
    @Inject(FEATURE_TOKENS.REPO) private readonly repo: IFeatureRepository,
    @Inject(FEATURE_TOKENS.ID_GENERATOR) private readonly idGen: IIdGenerator,
  ) {}

  async execute(command: CreateFeatureCommand): Promise<Feature> {
    const feature = Feature.create({ id: this.idGen.generate(), ...command });
    await this.repo.save(feature);
    return feature;
  }
}
```

Use cases necesarios por feature estándar:
- `CreateFeatureUseCase`
- `UpdateFeatureUseCase`
- `DeleteFeatureUseCase`
- `RestoreFeatureUseCase`
- `ListFeaturesUseCase`
- `GetFeatureUseCase`

## Paso 3 — Infrastructure

Crea `src/modules/<feature>/infrastructure/`:

```ts
// persistence/<feature>.typeorm-entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('<feature>s')
export class FeatureOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column() name: string;
  @CreateDateColumn() createdAt: Date;
  @DeleteDateColumn() deletedAt: Date | null;
}
```

```ts
// persistence/<feature>.mapper.ts
export class FeatureMapper {
  static toDomain(orm: FeatureOrmEntity): Feature {
    return Feature.reconstitute({ id: orm.id, userId: orm.userId, name: orm.name });
  }
  static toPersistence(domain: Feature): Partial<FeatureOrmEntity> {
    return { id: domain.id, userId: domain.userId, name: domain.name };
  }
}
```

```ts
// persistence/<feature>.typeorm.repository.ts
@Injectable()
export class FeatureTypeOrmRepository implements IFeatureRepository {
  constructor(
    @InjectRepository(FeatureOrmEntity)
    private readonly repo: Repository<FeatureOrmEntity>,
  ) {}

  async findById(id: string, userId: string): Promise<Feature | null> {
    const orm = await this.repo.findOne({ where: { id, userId } });
    return orm ? FeatureMapper.toDomain(orm) : null;
  }

  async save(feature: Feature): Promise<void> {
    await this.repo.save(FeatureMapper.toPersistence(feature));
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }
}
```

```ts
// <feature>.tokens.ts
export const FEATURE_TOKENS = {
  REPO: Symbol('IFeatureRepository'),
};
```

## Paso 4 — Presentation

Crea `src/modules/<feature>/presentation/`:

```ts
// dto/create-<feature>.dto.ts  — class-validator + Swagger AQUÍ, nunca en domain
import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ example: 'My Feature' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
```

```ts
// mappers/<feature>-dto.mapper.ts  — DTO → Command (nunca pasar el DTO a application)
export class FeatureDtoMapper {
  static toCreateCommand(dto: CreateFeatureDto, userId: string): CreateFeatureCommand {
    return { userId, name: dto.name };
  }
}
```

```ts
// <feature>.controller.ts
@ApiTags('<feature>s')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('<feature>s')
export class FeatureController {
  constructor(private readonly createUseCase: CreateFeatureUseCase) {}

  @Post()
  @ApiCreatedResponse({ type: FeatureResponseDto })
  async create(
    @Body() dto: CreateFeatureDto,
    @CurrentUser() user: { id: string },
  ) {
    const command = FeatureDtoMapper.toCreateCommand(dto, user.id);
    const result = await this.createUseCase.execute(command);
    return FeatureDtoMapper.toResponse(result);
  }
}
```

## Paso 5 — Module (Composition)

```ts
// <feature>.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([FeatureOrmEntity])],
  providers: [
    // Registrar ports → implementations
    { provide: FEATURE_TOKENS.REPO, useClass: FeatureTypeOrmRepository },
    // Use cases
    CreateFeatureUseCase,
    UpdateFeatureUseCase,
    DeleteFeatureUseCase,
    RestoreFeatureUseCase,
    ListFeaturesUseCase,
    GetFeatureUseCase,
    // Controller
    FeatureController,
  ],
  exports: [/* exportar use cases si otros módulos los necesitan */],
})
export class FeatureModule {}
```

## Paso 6 — Migración

```bash
pnpm migration:generate -- src/database/migrations/Add<Feature>Table
pnpm migration:run
```

Verifica la migración generada antes de correrla — TypeORM puede generar cosas extra.

## Paso 7 — Registrar en AppModule

```ts
// src/app.module.ts
imports: [
  // ...módulos existentes
  FeatureModule,
]
```

## Verificación final

- [ ] `domain/entities` no importa nada externo (cero deps fuera de `shared/domain`)
- [ ] `application` no importa TypeORM ni NestJS (solo `@Injectable`, `@Inject` están OK)
- [ ] `infrastructure` no usa lógica de negocio — solo persistencia y mapeo
- [ ] `presentation/dto` tiene `@ApiProperty` en todos los campos relevantes
- [ ] El mapper en `presentation/mappers/` convierte DTO → Command (el controller no construye el command directamente)
- [ ] El repositorio devuelve entidades de dominio, no ORM entities
- [ ] Los use cases no conocen `FeatureOrmEntity`
- [ ] El módulo registra todos los tokens simbólicos
