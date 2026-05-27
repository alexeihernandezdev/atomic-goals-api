# Plan Backend — Atomic Goals API

Stack: **NestJS 11 + TypeORM + PostgreSQL + JWT + class-validator + Swagger (OpenAPI)**.
Arquitectura: **Clean Architecture** (Domain / Application / Infrastructure / Presentation).
Repo: `atomic-goals-api/` (separado, hermano de `atomic-goals/`).

---

## 1. Decisiones de arquitectura

| Decisión | Valor |
|---|---|
| **Arquitectura** | **Clean Architecture** — 4 capas con dependencias unidireccionales hacia el dominio |
| Auth | JWT access (15 min) + refresh token (7 días) en cookie `httpOnly` `SameSite=Strict` |
| Ownership | Single-tenant por usuario — toda categoría, meta y paso pertenece a un `userId` |
| Modelo de pasos | **Tabla base + tablas por tipo** (Class-Table Inheritance / JTI con TypeORM) |
| Metas cíclicas | **Nueva instancia por ciclo** (entidad `GoalInstance`) para conservar histórico |
| Status custom | Definidos por paso individualmente (embebidos en `StepStatus`) |
| Cálculo de progreso | Promedio ponderado por `weight` de cada paso |
| Borrado | Soft delete (`deletedAt`) — TypeORM `@DeleteDateColumn` + filtros por defecto |
| Fechas | `startDate` y `endDate` opcionales tanto en meta como en paso |
| Validación | `class-validator` + `class-transformer` en DTOs de la capa de presentación |
| Documentación API | Swagger (`@nestjs/swagger`) → expone `/api/docs` y `/api/docs-json` para generar cliente |
| Config | `@nestjs/config` con `.env` validado por Joi |
| DB local | Postgres 16 en `docker-compose.yml` |

### 1.1 Clean Architecture — reglas

**Capas y regla de dependencia** (las flechas indican "depende de"):

```
Presentation ──► Application ──► Domain
Infrastructure ─────────────────► Domain
Infrastructure ──► Application (solo implementa puertos)
```

- **Domain** es el núcleo. No depende de nada (ni de Nest, ni de TypeORM, ni de Express). Solo TypeScript puro.
- **Application** define **casos de uso** y declara **puertos** (interfaces) que necesita. Solo depende de Domain.
- **Infrastructure** **implementa** los puertos: repositorios TypeORM, JWT, bcrypt, cookies, mailer, etc.
- **Presentation** (controllers REST, guards, decorators, filtros HTTP) **invoca casos de uso**. No conoce TypeORM ni entidades de DB.
- Inversión de dependencias vía **tokens de inyección** de Nest: cada puerto se registra con `provide: GOAL_REPOSITORY` y se mapea a su implementación en el `Module`.
- Las **entidades de dominio** son distintas de las **entidades de persistencia TypeORM**. Mappers en infrastructure convierten entre ambas.
- Los **DTOs HTTP** (con `class-validator`) son distintos de los **comandos/queries de application** y de las **entidades de dominio**. Mappers en presentation convierten DTO → Command.

---

## 2. Estructura de carpetas (Clean Architecture)

```
atomic-goals-api/
├── docker-compose.yml
├── .env.example
├── src/
│   ├── main.ts                              # bootstrap + Swagger + ValidationPipe + CORS
│   ├── app.module.ts                        # composición raíz: importa los module roots
│   │
│   ├── shared/                              # cross-cutting (cualquier capa puede importar)
│   │   ├── domain/
│   │   │   ├── errors/                      # DomainError, NotFoundError, ConflictError...
│   │   │   ├── value-objects/               # Uuid, Email, Password (base)
│   │   │   └── result.ts                    # Result<T,E> (opcional)
│   │   └── kernel/
│   │       └── pagination.ts                # tipos puros compartidos
│   │
│   ├── config/                              # infrastructure transversal
│   │   ├── configuration.ts
│   │   └── validation.schema.ts             # Joi
│   │
│   ├── database/                            # infrastructure transversal
│   │   ├── data-source.ts                   # CLI DataSource para migrations
│   │   └── migrations/
│   │
│   └── modules/                             # un módulo por bounded context
│       ├── auth/
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   └── user.entity.ts       # PURO, sin decoradores de ORM
│       │   │   ├── value-objects/
│       │   │   │   ├── email.vo.ts
│       │   │   │   └── password.vo.ts       # invariantes (longitud, hash)
│       │   │   ├── errors/
│       │   │   │   ├── invalid-credentials.error.ts
│       │   │   │   └── email-already-in-use.error.ts
│       │   │   ├── services/                # domain services (lógica que no encaja en una entidad)
│       │   │   └── ports/                   # interfaces (output ports)
│       │   │       ├── user.repository.ts   # interface IUserRepository
│       │   │       ├── password-hasher.ts   # interface IPasswordHasher
│       │   │       └── token-service.ts     # interface ITokenService
│       │   │
│       │   ├── application/
│       │   │   ├── use-cases/
│       │   │   │   ├── register-user.use-case.ts
│       │   │   │   ├── login.use-case.ts
│       │   │   │   ├── refresh-tokens.use-case.ts
│       │   │   │   ├── logout.use-case.ts
│       │   │   │   └── get-current-user.use-case.ts
│       │   │   ├── commands/                # input DTOs de application (no HTTP)
│       │   │   │   └── register-user.command.ts
│       │   │   ├── queries/
│       │   │   └── ports/                   # input ports si se usa CQRS explícito (opcional)
│       │   │
│       │   ├── infrastructure/
│       │   │   ├── persistence/
│       │   │   │   ├── user.typeorm-entity.ts   # entidad TypeORM (decoradores)
│       │   │   │   ├── user.mapper.ts           # domain ↔ persistence
│       │   │   │   └── user.typeorm.repository.ts  # implements IUserRepository
│       │   │   ├── crypto/
│       │   │   │   └── bcrypt-password-hasher.ts
│       │   │   ├── tokens/
│       │   │   │   └── jwt-token.service.ts
│       │   │   └── auth.tokens.ts           # const TOKENS = { USER_REPO: Symbol(...), ... }
│       │   │
│       │   ├── presentation/
│       │   │   ├── auth.controller.ts
│       │   │   ├── dto/                     # HTTP DTOs con class-validator + @ApiProperty
│       │   │   │   ├── register.dto.ts
│       │   │   │   └── login.dto.ts
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   └── jwt-refresh.guard.ts
│       │   │   ├── strategies/
│       │   │   │   ├── jwt.strategy.ts
│       │   │   │   └── jwt-refresh.strategy.ts
│       │   │   ├── decorators/
│       │   │   │   ├── current-user.decorator.ts
│       │   │   │   └── public.decorator.ts
│       │   │   └── mappers/
│       │   │       └── register-dto.mapper.ts  # DTO → Command
│       │   │
│       │   └── auth.module.ts               # registra puertos → implementaciones
│       │
│       ├── users/                           # mismo patrón: domain/application/infrastructure/presentation
│       ├── categories/
│       ├── goals/
│       ├── goal-instances/
│       ├── steps/
│       ├── dashboard/                       # mayormente read-side (queries)
│       ├── activity/
│       └── trash/
│
├── common/                                  # adaptadores de presentación reutilizables
│   ├── filters/
│   │   ├── domain-exception.filter.ts       # mapea DomainError → HTTP status
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── parse-uuid.pipe.ts
│   └── decorators/
│       └── log-activity.decorator.ts
│
└── test/                                    # vacío por ahora (testing fuera del plan)
```

### 2.1 Reglas de imports (linter)

Configurar `eslint-plugin-boundaries` o `dependency-cruiser` para forzar:

| Desde | Puede importar |
|---|---|
| `domain` | `shared/domain`, `shared/kernel`, su propio `domain` |
| `application` | su propio `domain`, `shared/domain`, `shared/kernel` |
| `infrastructure` | su propio `domain`, su propio `application` (puertos), `shared`, libs externas |
| `presentation` | su propio `application`, su propio `domain` (solo tipos/errores), `common`, libs externas |
| `domain` ❌ | nunca: NestJS, TypeORM, axios, bcrypt, jsonwebtoken, etc. |
| `application` ❌ | TypeORM, frameworks HTTP, librerías de infraestructura |

---

## 3. Modelo de datos

> **Doble representación**: cada agregado tiene una **entidad de dominio** (clase pura, invariantes, lógica de negocio) y una **entidad de persistencia TypeORM** (decoradores, columnas). Un **mapper** convierte entre ambas. Las relaciones siguientes describen la **estructura de tablas** (capa de persistencia); las entidades de dominio exponen colecciones y métodos, no FKs.

### 3.0 Ejemplo del par dominio/persistencia (Goal)

```ts
// modules/goals/domain/entities/goal.entity.ts  (PURO)
export class Goal {
  private constructor(
    public readonly id: Uuid,
    public readonly userId: Uuid,
    public readonly categoryId: Uuid,
    private _name: string,
    private _type: GoalType,
    // ...
  ) {}
  static create(props: CreateGoalProps): Goal { /* invariantes aquí */ }
  rename(newName: string) { /* invariantes */ }
  // sin decoradores, sin imports de typeorm
}

// modules/goals/infrastructure/persistence/goal.typeorm-entity.ts
@Entity('goals')
export class GoalOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  // ...
}

// modules/goals/infrastructure/persistence/goal.mapper.ts
export class GoalMapper {
  static toDomain(orm: GoalOrmEntity): Goal { /* ... */ }
  static toPersistence(domain: Goal): GoalOrmEntity { /* ... */ }
}
```

A continuación se describen los **esquemas de las tablas** (persistencia):

### Entidades TypeORM

### 3.1 `User` (`users`)
- `id: uuid` (PK)
- `email: string` (unique, lowercased)
- `passwordHash: string`
- `name: string`
- `refreshTokenHash: string | null` (bcrypt del refresh activo)
- `createdAt`, `updatedAt`, `deletedAt`

### 3.2 `Category` (`categories`)
- `id`, `name`, `description?`, `color?` (hex), `icon?`
- `userId` (FK → User) — index
- timestamps + `deletedAt`
- Relación: `OneToMany(Goal)`

### 3.3 `Goal` (`goals`)
- `id`, `name`, `description?`
- `type: 'CONCLUSIVE' | 'CYCLIC'`
- `cyclePeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM_DAYS'`
- `customCycleDays?: number`
- `startDate?: timestamptz`, `endDate?: timestamptz`
- `estimatedDurationMinutes?: number`
- `categoryId` (FK → Category, ON DELETE RESTRICT) — index
- `userId` (FK → User, redundante para queries directas) — index
- timestamps + `deletedAt`

### 3.4 `GoalInstance` (`goal_instances`)
- Representa una **ejecución** de una meta cíclica (o única para CONCLUSIVE).
- `id`, `goalId` (FK)
- `cycleStart: timestamptz`, `cycleEnd: timestamptz`
- `status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ARCHIVED'`
- `progress: numeric(5,2)` (cacheado, recalculado al actualizar pasos)
- `completedAt?`
- timestamps + `deletedAt`
- Para metas CONCLUSIVE → siempre 1 instancia.
- Para metas CYCLIC → un job/endpoint genera la siguiente instancia al cerrar la actual (ver §6.5).

### 3.5 `Step` (`steps`) — clase base
- `id`, `title`, `description?`
- `type: 'PROGRESS_BAR' | 'CHECK' | 'STATUS' | 'COUNTER'` (discriminator)
- `weight: numeric(5,2) DEFAULT 1.0` — peso para promedio ponderado
- `order: integer` — posición en la lista
- `startDate?`, `endDate?`, `estimatedDurationMinutes?`
- `goalInstanceId` (FK → GoalInstance) — index
- timestamps + `deletedAt`

### 3.6 Subtipos de Step (Class-Table Inheritance)

Implementación TypeORM: `@TableInheritance({ column: 'type' })` en `Step` + `@ChildEntity('PROGRESS_BAR')` etc. Cada hijo añade su tabla con FK a `steps.id`.

**`ProgressBarStep`** (`steps_progress_bar`)
- `current: numeric(7,2)`, `target: numeric(7,2)`
- `unit?: string` (ej. "%", "km")
- Progreso: `current / target * 100`

**`CheckStep`** (`steps_check`)
- `done: boolean`
- Progreso: 0 ó 100

**`StatusStep`** (`steps_status`)
- `statuses: jsonb` — array `[{ id, label, percentage, order }]` definidos por el paso
- `currentStatusId: string`
- Progreso: percentage del status actual

**`CounterStep`** (`steps_counter`)
- `current: numeric(10,2)`, `max: numeric(10,2)`, `min: numeric(10,2) DEFAULT 0`
- `unit?: string` (ej. "páginas", "USD")
- Progreso: `(current - min) / (max - min) * 100`

### 3.7 `ActivityLog` (`activity_logs`)
- `id`, `userId` (FK), `action: enum`, `entity: enum`, `entityId: uuid`, `metadata: jsonb`, `createdAt`
- Acciones: `CREATED`, `UPDATED`, `DELETED`, `COMPLETED`, `RESTORED`
- Alimenta el "Actividad reciente" del dashboard.

### 3.8 Diagrama relacional resumido

```
User 1 ── N Category 1 ── N Goal 1 ── N GoalInstance 1 ── N Step ── (subtype)
User 1 ── N ActivityLog
```

---

## 4. Endpoints REST

Prefijo global: **`/api/v1`**. Todos (excepto auth público) requieren `JwtAuthGuard`.

### 4.1 Auth — `/api/v1/auth`
| Método | Path | Body | Respuesta | Notas |
|---|---|---|---|---|
| POST | `/register` | `{ email, password, name }` | `{ user, accessToken }` + cookie `refresh_token` | password ≥ 8, bcrypt cost 12 |
| POST | `/login` | `{ email, password }` | `{ user, accessToken }` + cookie | |
| POST | `/refresh` | — (lee cookie) | `{ accessToken }` + rota cookie | usa `JwtRefreshGuard` |
| POST | `/logout` | — | `204` | invalida `refreshTokenHash`, clear cookie |
| GET | `/me` | — | `User` | |

### 4.2 Categories — `/api/v1/categories`
| Método | Path |
|---|---|
| GET | `/` (lista del usuario, `?includeDeleted=true` opcional) |
| GET | `/:id` |
| POST | `/` |
| PATCH | `/:id` |
| DELETE | `/:id` (soft) |
| POST | `/:id/restore` |

### 4.3 Goals — `/api/v1/goals`
| Método | Path | Notas |
|---|---|---|
| GET | `/` | `?categoryId=&type=&status=&page=&limit=` |
| GET | `/:id` | incluye instancias y pasos de la activa |
| POST | `/` | crea Goal + primera GoalInstance |
| PATCH | `/:id` | metadata; no toca instancias |
| DELETE | `/:id` | soft (cascada lógica a instancias y pasos) |
| POST | `/:id/restore` | |
| GET | `/:id/instances` | histórico de ciclos |

### 4.4 Goal Instances — `/api/v1/goal-instances`
| Método | Path | Notas |
|---|---|---|
| GET | `/:id` | con pasos completos |
| PATCH | `/:id` | cambiar status manualmente (archivar, marcar failed) |
| POST | `/:id/complete` | fuerza COMPLETED y dispara generación de la siguiente instancia si la meta es CYCLIC |
| POST | `/:id/next-cycle` | (interno o manual) genera la siguiente instancia copiando los pasos como plantilla |

### 4.5 Steps — `/api/v1/steps`
| Método | Path | Body | Notas |
|---|---|---|---|
| POST | `/` | base + payload del subtipo | `goalInstanceId` requerido; valida `type` |
| GET | `/:id` | | |
| PATCH | `/:id` | metadata + progreso (current, done, currentStatusId…) | dispara recálculo de `GoalInstance.progress` |
| DELETE | `/:id` | soft | |
| POST | `/:id/restore` | | |
| POST | `/:id/reorder` | `{ newOrder }` | reordena dentro de la instancia |

### 4.6 Dashboard — `/api/v1/dashboard`
| Método | Path | Respuesta |
|---|---|---|
| GET | `/summary` | `{ totalGoals, completedGoals, inProgressGoals, currentStreak, byCategory: [...] }` |
| GET | `/timeline?range=week\|month\|year` | datos para gráficas de progreso temporal |
| GET | `/calendar?from=&to=` | pasos y metas con fecha en el rango |
| GET | `/upcoming?limit=10` | metas/pasos próximos a vencer |

### 4.7 Activity — `/api/v1/activity`
| Método | Path |
|---|---|
| GET | `/?limit=20&cursor=` (paginación por cursor) |

### 4.8 Trash — `/api/v1/trash`
| Método | Path | Notas |
|---|---|---|
| GET | `/` | lista todo lo soft-deleted del user |
| POST | `/restore/:entity/:id` | atajo a restore |
| DELETE | `/:entity/:id/permanent` | hard delete definitivo |

---

## 5. Reglas de negocio críticas

> Toda la lógica de esta sección vive en **Domain** (entidades + domain services) o **Application** (use cases que orquestan). Nunca en controllers ni en repositorios.

### 5.1 Cálculo de progreso — `ProgressCalculator` (Domain Service)
Ubicación: `modules/goals/domain/services/progress-calculator.ts` (clase pura, sin deps).

Para una `GoalInstance`:
```
progress = Σ(step.progress * step.weight) / Σ(step.weight)
```
- Si no hay pasos → `progress = 0`.
- Invocado por el caso de uso `UpdateStepProgressUseCase` tras mutar el paso.
- Persistido en `GoalInstance.progress` (cache) por el repositorio dentro de la misma transacción (Unit of Work).
- Publica evento de dominio `GoalInstanceProgressUpdated` a través de un `IEventBus` (puerto).

### 5.2 Progreso por subtipo de paso
- `ProgressBar`: `clamp(current/target * 100, 0, 100)`
- `Check`: `done ? 100 : 0`
- `Status`: `statuses.find(s => s.id === currentStatusId).percentage`
- `Counter`: `clamp((current-min)/(max-min) * 100, 0, 100)`

### 5.3 Cierre de ciclo (metas CYCLIC)
- Caso de uso `CloseAndCreateNextCycleUseCase` (Application):
  1. La instancia actual pasa a `COMPLETED` (o `FAILED` si no llegó al 100%).
  2. Se crea una nueva `GoalInstance` con `cycleStart = previousEnd` y `cycleEnd = cycleStart + period`.
  3. Se **clonan los pasos** de la instancia anterior reseteando su progreso (`current=0`, `done=false`, `currentStatusId = primer status`).
- La regla de cuándo cerrar vive en `Goal.shouldCloseCurrentCycle(now)` (entidad de dominio).
- Generación **on-demand**: al consultar `GetGoalUseCase` se verifica si toca cerrar. Sin cron job todavía.

### 5.4 Streaks
- Domain service `StreakCalculator` en `modules/dashboard/domain/services/`.
- Invocado por `GetDashboardSummaryUseCase` mirando `GoalInstance` cíclicas consecutivas completadas (`status = COMPLETED`) sin huecos.

### 5.5 Activity log
- Implementado como **decorador de application**: `@RecordsActivity('CREATED','GOAL')` envuelve el use case y, tras éxito, invoca `IActivityLogger` (puerto en application, implementado en infrastructure).
- Alternativa: emitir un evento de dominio desde la entidad y suscribir un handler en application.

---

## 5.6 Casos de uso por módulo (Application)

> Cada caso de uso es una clase con un único método `execute(command)` que devuelve un resultado tipado o lanza un `DomainError`. Los controllers solo invocan use cases.

**auth**: `RegisterUser`, `Login`, `RefreshTokens`, `Logout`, `GetCurrentUser`.
**categories**: `CreateCategory`, `UpdateCategory`, `DeleteCategory`, `RestoreCategory`, `ListUserCategories`, `GetCategory`.
**goals**: `CreateGoal`, `UpdateGoal`, `DeleteGoal`, `RestoreGoal`, `ListGoals`, `GetGoal`, `ListGoalInstances`.
**goal-instances**: `GetGoalInstance`, `UpdateGoalInstanceStatus`, `CompleteGoalInstance`, `CloseAndCreateNextCycle`.
**steps**: `CreateStep`, `UpdateStepMetadata`, `UpdateStepProgress`, `DeleteStep`, `RestoreStep`, `ReorderStep`.
**dashboard**: `GetDashboardSummary`, `GetProgressTimeline`, `GetCalendarEvents`, `GetUpcoming`.
**activity**: `ListUserActivity`.
**trash**: `ListTrash`, `RestoreEntity`, `PermanentlyDeleteEntity`.

## 5.7 Puertos clave (interfaces declaradas en Domain o Application)

| Puerto | Capa | Implementación |
|---|---|---|
| `IUserRepository`, `ICategoryRepository`, `IGoalRepository`, `IGoalInstanceRepository`, `IStepRepository`, `IActivityLogRepository` | Domain | TypeORM repos en `infrastructure/persistence/` |
| `IPasswordHasher` | Domain | `BcryptPasswordHasher` |
| `ITokenService` | Domain | `JwtTokenService` |
| `IUnitOfWork` | Application | `TypeOrmUnitOfWork` (envuelve `DataSource.transaction`) |
| `IClock` | Domain | `SystemClock` (inyectable, facilita testing) |
| `IIdGenerator` | Domain | `UuidV4Generator` |
| `IEventBus` | Application | `NestEventBus` (`@nestjs/event-emitter`) |
| `IActivityLogger` | Application | `ActivityLoggerService` |

---

## 6. Fases de implementación

### Fase 0 — Setup + esqueleto Clean Architecture (1.5 días)
**Entregable**: API arranca con healthcheck, Postgres conectado, estructura de carpetas Clean creada con un módulo de ejemplo (health).
- [ ] Instalar deps: `@nestjs/typeorm typeorm pg @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/swagger @nestjs/event-emitter joi cookie-parser`.
- [ ] Dev deps: `eslint-plugin-boundaries` (o `dependency-cruiser`) para enforcing de capas.
- [ ] `docker-compose.yml` con `postgres:16-alpine` (puerto 5433) + volumen persistente.
- [ ] `.env.example` con `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES=7d`, `CORS_ORIGIN=http://localhost:3000`.
- [ ] `src/config/configuration.ts` + `validation.schema.ts` (Joi).
- [ ] `src/database/data-source.ts` para CLI de migraciones.
- [ ] Crear estructura `src/shared/{domain,kernel}` con `DomainError`, `NotFoundError`, `ConflictError`, `ValidationError`, `Uuid` VO, `Result<T,E>`.
- [ ] `DomainExceptionFilter` que mapea cada `DomainError` a su HTTP status (404, 409, 422...).
- [ ] Reglas `eslint-plugin-boundaries` configuradas y verificadas.
- [ ] `main.ts`: `ValidationPipe({ whitelist:true, transform:true })`, `cookieParser`, CORS con credentials, prefix `/api/v1`, Swagger en `/api/docs`, filtros globales.
- [ ] Módulo `health` siguiendo el patrón Clean (domain trivial, use case `CheckHealth`, controller).

### Fase 1 — Auth + Users (2.5 días)
**Entregable**: registro/login con JWT + refresh, todo bajo Clean Architecture.
- [ ] **Domain**: entidad `User` (pura), VOs `Email`, `Password`, errores `InvalidCredentialsError`, `EmailAlreadyInUseError`.
- [ ] **Domain**: puertos `IUserRepository`, `IPasswordHasher`, `ITokenService`.
- [ ] **Application**: use cases `RegisterUserUseCase`, `LoginUseCase`, `RefreshTokensUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase` + commands.
- [ ] **Infrastructure**: `UserOrmEntity` + migración + `UserMapper` + `UserTypeOrmRepository` (implementa `IUserRepository`).
- [ ] **Infrastructure**: `BcryptPasswordHasher`, `JwtTokenService`.
- [ ] **Presentation**: `AuthController` con `register/login/refresh/logout/me`, DTOs HTTP (class-validator + Swagger), `JwtStrategy`, `JwtRefreshStrategy`, guards `JwtAuthGuard` (global con `@Public()`), `JwtRefreshGuard`, decorador `@CurrentUser()`.
- [ ] `AuthModule` registra todos los puertos → implementaciones via tokens DI.
- [ ] Helper `setRefreshCookie(res, token)` en presentation.

### Fase 2 — Categorías (1.5 días)
**Entregable**: CRUD completo + soft delete + restore, respetando capas.
- [ ] **Domain**: entidad `Category`, puerto `ICategoryRepository`, error `CategoryNameAlreadyExistsError`.
- [ ] **Application**: 6 use cases (§5.6).
- [ ] **Infrastructure**: `CategoryOrmEntity` + migración (índice único parcial `WHERE deleted_at IS NULL`), `CategoryMapper`, `CategoryTypeOrmRepository`.
- [ ] **Presentation**: `CategoriesController`, DTOs, filtro implícito por `userId` del JWT inyectado en los commands.

### Fase 3 — Metas + Goal Instances (3 días)
**Entregable**: crear meta CONCLUSIVE y CYCLIC; ciclo manual funcionando.
- [ ] **Domain**: entidades `Goal`, `GoalInstance`, VOs `CyclePeriod`, errores propios.
- [ ] **Domain**: regla `Goal.shouldCloseCurrentCycle(now: Date)`, factory `Goal.create()` que valida invariantes (e.g., custom_days requiere type=CYCLIC).
- [ ] **Domain**: puertos `IGoalRepository`, `IGoalInstanceRepository`, `IClock`.
- [ ] **Application**: use cases de §5.6 (goals + goal-instances). `CreateGoalUseCase` usa `IUnitOfWork` para crear Goal + primera GoalInstance atómicamente.
- [ ] **Application**: `CloseAndCreateNextCycleUseCase`.
- [ ] **Infrastructure**: entidades ORM, mappers, repos, `SystemClock`, `TypeOrmUnitOfWork`.
- [ ] **Presentation**: controllers `GoalsController`, `GoalInstancesController`, DTOs, mappers DTO→Command.
- [ ] Cierre on-demand: `GetGoalUseCase` consulta `IClock` y delega a `CloseAndCreateNextCycleUseCase` si corresponde.

### Fase 4 — Pasos (STI) (3.5 días)
**Entregable**: los 4 tipos de paso operativos + recálculo de progreso.
- [ ] **Domain**: jerarquía `Step` (abstract) con subclases `ProgressBarStep`, `CheckStep`, `StatusStep`, `CounterStep`. Cada una expone método `progress(): number` con su fórmula (§5.2).
- [ ] **Domain**: `ProgressCalculator` (domain service, recibe `Step[]` y devuelve número 0–100).
- [ ] **Domain**: errores `InvalidStepConfigError`, `WeightMustBePositiveError`.
- [ ] **Domain**: puerto `IStepRepository` (devuelve subclases concretas).
- [ ] **Application**: use cases `CreateStep`, `UpdateStepMetadata`, `UpdateStepProgress`, `Delete`, `Restore`, `Reorder`. `UpdateStepProgressUseCase` recalcula progress y persiste vía `IUnitOfWork`.
- [ ] **Infrastructure**: `StepOrmEntity` base con `@TableInheritance` + 4 `@ChildEntity` + migración. `StepMapper` con switch por tipo. `StepTypeOrmRepository`.
- [ ] **Presentation**: `StepsController`, DTOs con discriminator (`@Type` + `@ValidateNested` por tipo).

### Fase 5 — Dashboard + Activity (2.5 días)
**Entregable**: endpoints del dashboard responden datos reales.
- [ ] **Domain (activity)**: entidad `ActivityLog`, enums, puerto `IActivityLogRepository`, puerto `IActivityLogger` (application).
- [ ] **Domain (dashboard)**: domain service `StreakCalculator`.
- [ ] **Application (dashboard)**: use cases `GetSummary`, `GetTimeline`, `GetCalendar`, `GetUpcoming`. Pueden leer de **read models** o repos especializados (`IDashboardReadModel`) para queries agregadas.
- [ ] **Application**: decorador `@RecordsActivity()` o suscriptor de eventos.
- [ ] **Infrastructure**: `ActivityLogOrmEntity` + migración, `ActivityLoggerService`, `DashboardTypeOrmReadModel` con QueryBuilder.
- [ ] **Presentation**: `DashboardController`, `ActivityController` (cursor pagination).

### Fase 6 — Trash (1 día)
**Entregable**: listar, restaurar y borrar permanentemente.
- [ ] **Application**: use cases `ListTrash`, `RestoreEntity`, `PermanentlyDeleteEntity` (recibe `entity: 'category'|'goal'|'step'`).
- [ ] **Infrastructure**: extender repos con `findDeleted()` y `permanentDelete()`.
- [ ] **Presentation**: `TrashController` con confirmación lógica.

### Fase 7 — OpenAPI / Cliente generado (½ día)
**Entregable**: Swagger completo y consumible por openapi-typescript.
- [ ] Anotar **DTOs HTTP** (no entidades de dominio) con `@ApiProperty`, `@ApiResponse`.
- [ ] Swagger en `main.ts` con `DocumentBuilder` (bearer + cookie auth).
- [ ] Servir `openapi.json` para el front.

---

## 7. Migrations
- TypeORM CLI vía `data-source.ts`.
- Comandos en `package.json`:
  - `migration:generate -- src/database/migrations/<name>`
  - `migration:run`
  - `migration:revert`
- **Una migración por fase** (no autogenerar todo de golpe).

---

## 8. Seguridad — checklist
- [ ] bcrypt cost 12 para passwords y refresh tokens.
- [ ] Refresh token rotado en cada uso (one-time use).
- [ ] CORS con `credentials: true` y origin explícito.
- [ ] Helmet (`@nestjs/helmet` o `helmet` middleware).
- [ ] Rate limiting (`@nestjs/throttler`) en `/auth/*`.
- [ ] `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true`.
- [ ] Nunca devolver `passwordHash` ni `refreshTokenHash` (serializer / `@Exclude`).
- [ ] Logs sin PII.

---

## 9. docker-compose.yml (mínimo)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5433:5432"]
    environment:
      POSTGRES_USER: atomic
      POSTGRES_PASSWORD: atomic
      POSTGRES_DB: atomic_goals
    volumes:
      - atomic-pg-data:/var/lib/postgresql/data
volumes:
  atomic-pg-data:
```
(Servicios `api` y `web` opcionales para etapa posterior.)

---

## 10. Orden de implementación recomendado
`Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7` (~15 días de desarrollo focalizado con Clean Architecture).

Bloqueante para el frontend: terminar **Fase 1, 2 y 7** (Swagger expuesto) antes de que el front pueda generar su cliente.

---

## 11. Convenciones Clean Architecture — quick reference

- **¿Dónde va una regla de negocio nueva?** Si solo involucra una entidad y sus invariantes → método en la entidad de dominio. Si involucra varias entidades o coordinación → domain service. Si requiere I/O (repo, evento, mailer) → use case en application orquestando puertos.
- **¿Dónde va un `if` de "el usuario debe ser el dueño"?** En el use case (application), comparando `command.userId` con `entity.userId`. Lanza `ForbiddenError` (DomainError). El guard JWT solo extrae la identidad.
- **¿Las migraciones acceden al dominio?** No. Las migraciones describen el esquema de las **tablas** (persistencia), no las entidades de dominio.
- **¿Los DTOs HTTP llegan a application?** Nunca. Un mapper en presentation convierte `RegisterDto` → `RegisterUserCommand` antes de invocar el use case.
- **¿Los repositorios devuelven entidades ORM?** Nunca a application. Siempre devuelven entidades de dominio reconstituidas por el mapper.
- **¿Swagger en application/domain?** Nunca. Solo en DTOs de presentation.
- **¿class-validator en domain?** Nunca. Las invariantes de dominio se validan con código TS puro en factories/setters; `class-validator` solo en DTOs HTTP.
