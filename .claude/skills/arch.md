# Arquitectura Atomic Goals API — Clean Architecture (NestJS)

Stack: **NestJS 11 + TypeORM + PostgreSQL + JWT + class-validator + Swagger**.

Antes de escribir cualquier código, internaliza estas reglas y aplícalas sin excepción.

## Capas y regla de dependencia

```
Presentation ──► Application ──► Domain
Infrastructure ─────────────────► Domain
Infrastructure ──► Application  (solo implementa puertos)
```

| Capa | Responsabilidad | Prohibido |
|---|---|---|
| **Domain** | Entidades puras, VOs, errores, puertos (interfaces), domain services | NestJS, TypeORM, Express, bcrypt, jsonwebtoken, cualquier lib externa |
| **Application** | Use cases (orquestación), commands/queries, puertos de application (IUnitOfWork, IEventBus, IActivityLogger) | TypeORM, HTTP, frameworks |
| **Infrastructure** | Repositorios TypeORM, mappers ORM↔dominio, JWT, Bcrypt, eventos | — |
| **Presentation** | Controllers, DTOs HTTP (class-validator + Swagger), guards, strategies, decorators, mappers DTO→Command | TypeORM, lógica de negocio |

## Estructura de carpetas por módulo

```
src/modules/<feature>/
├── domain/
│   ├── entities/<feature>.entity.ts         # clase pura, sin decoradores de ORM
│   ├── value-objects/
│   ├── errors/
│   ├── services/                            # domain services (lógica multi-entidad)
│   └── ports/                              # interfaces (output ports): I<Feature>Repository, etc.
├── application/
│   ├── use-cases/
│   │   ├── create-<feature>.use-case.ts
│   │   └── ...
│   └── commands/
│       └── create-<feature>.command.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── <feature>.typeorm-entity.ts     # entidad TypeORM con decoradores
│   │   ├── <feature>.mapper.ts             # toDomain() / toPersistence()
│   │   └── <feature>.typeorm.repository.ts # implements I<Feature>Repository
│   └── <feature>.tokens.ts                # const TOKENS = { REPO: Symbol(...), ... }
├── presentation/
│   ├── <feature>.controller.ts
│   ├── dto/
│   │   ├── create-<feature>.dto.ts         # class-validator + @ApiProperty
│   │   └── update-<feature>.dto.ts
│   └── mappers/
│       └── <feature>-dto.mapper.ts         # DTO → Command
└── <feature>.module.ts                    # registra tokens → implementaciones (DI)
```

## Reglas de imports — no negociables

| Desde | Puede importar |
|---|---|
| `domain` | `shared/domain`, `shared/kernel`, su propio `domain` |
| `application` | su propio `domain`, `shared/domain`, `shared/kernel` |
| `infrastructure` | su `domain`, su `application` (puertos), `shared`, libs externas |
| `presentation` | su `application`, su `domain` (solo tipos/errores), `common`, libs externas |

**PROHIBIDO:**
- `domain` importa NestJS, TypeORM, bcrypt, jsonwebtoken — cualquier lib externa.
- `application` importa TypeORM, frameworks HTTP, librerías de infraestructura.
- `presentation` importa `infrastructure` directamente (solo los `tokens.ts` para DI).
- DTOs HTTP (class-validator) en domain o application.
- `@ApiProperty` fuera de `presentation/dto/`.

## Inversión de dependencias con NestJS

Cada puerto se inyecta con un token simbólico:

```ts
// infrastructure/<feature>.tokens.ts
export const TOKENS = {
  REPO: Symbol('<Feature>Repository'),
};

// <feature>.module.ts
providers: [
  { provide: TOKENS.REPO, useClass: FeatureTypeOrmRepository },
  CreateFeatureUseCase,
]
```

Use case recibe el puerto:
```ts
@Injectable()
export class CreateFeatureUseCase {
  constructor(
    @Inject(TOKENS.REPO) private readonly repo: IFeatureRepository,
  ) {}
  async execute(command: CreateFeatureCommand): Promise<Feature> { ... }
}
```

## Doble representación: dominio vs persistencia

```
Feature (dominio puro)  ←──── FeatureMapper ────►  FeatureOrmEntity (TypeORM)
```

- Mapper siempre en `infrastructure/persistence/<feature>.mapper.ts`.
- Los repositorios devuelven **entidades de dominio**, nunca entidades ORM.
- Los use cases nunca ven `FeatureOrmEntity`.

## Puertos clave (cross-cutting)

| Puerto | Declarado en | Implementado en |
|---|---|---|
| `I<X>Repository` | `domain/ports/` del módulo | `infrastructure/persistence/` del módulo |
| `IPasswordHasher` | `auth/domain/ports/` | `BcryptPasswordHasher` |
| `ITokenService` | `auth/domain/ports/` | `JwtTokenService` |
| `IUnitOfWork` | `shared/application/` | `TypeOrmUnitOfWork` |
| `IClock` | `shared/domain/` | `SystemClock` |
| `IIdGenerator` | `shared/domain/` | `UuidV4Generator` |
| `IEventBus` | `shared/application/` | `NestEventBus` |
| `IActivityLogger` | `shared/application/` | `ActivityLoggerService` |

## Modelo de datos resumido

```
User 1──N Category 1──N Goal 1──N GoalInstance 1──N Step (discriminated: ProgressBar|Check|Status|Counter)
User 1──N ActivityLog
```

- Soft delete en todas las tablas (`deletedAt`).
- Steps usan Class-Table Inheritance: tabla base `steps` + 4 tablas hijas.
- `GoalInstance.progress` es un campo cacheado, recalculado por `ProgressCalculator`.

## Quick reference

- **¿Dónde va una regla de negocio?**
  - Invariante de una entidad → método/factory en `domain/entities/`.
  - Lógica que involucra varias entidades → `domain/services/`.
  - Requiere I/O (repo, evento) → use case en `application/`.
- **¿Dónde va el "user debe ser el dueño"?** En el use case, comparando `command.userId` con `entity.userId`. Lanza `ForbiddenError`.
- **¿Los DTOs llegan a application?** Nunca. El mapper en `presentation/mappers/` convierte `CreateDto` → `CreateCommand`.
- **¿Los repositorios devuelven ORM entities?** Nunca hacia application. Devuelven entidades de dominio.
- **¿Swagger en domain/application?** Nunca. Solo en `presentation/dto/`.
- **¿class-validator en domain?** Nunca. Invariantes con TS puro en factories/setters.
- **¿Migraciones acceden al dominio?** No. Describen esquema de tablas (persistencia).
