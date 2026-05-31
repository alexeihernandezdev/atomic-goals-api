# Añadir nuevo endpoint a un módulo existente

Usa este skill cuando el módulo ya existe y solo necesitas agregar un endpoint nuevo (ej: una acción especial, un query adicional, una sub-ruta).

## Cuándo usar este skill vs /new-feature

- **`/new-feature`**: el bounded context no existe aún (crear todo desde cero).
- **`/new-endpoint`**: el módulo existe, solo añades capacidad nueva.

## Checklist por capa

### 1. ¿El caso de uso ya existe?

Si no existe, créalo en `application/use-cases/`:

```ts
@Injectable()
export class <Action><Feature>UseCase {
  constructor(
    @Inject(FEATURE_TOKENS.REPO) private readonly repo: IFeatureRepository,
  ) {}

  async execute(command: <Action><Feature>Command): Promise<Result> {
    const feature = await this.repo.findById(command.id, command.userId);
    if (!feature) throw new FeatureNotFoundError(command.id);

    // Lógica de negocio aquí o delegada a domain service
    feature.someAction();

    await this.repo.save(feature);
    return feature;
  }
}
```

Regla: el use case verifica ownership (`command.userId === entity.userId`). Si no coincide, lanza `ForbiddenError`.

### 2. ¿El repositorio necesita un método nuevo?

Si sí:
1. Agregar el método a la interface en `domain/ports/<feature>.repository.ts`.
2. Implementarlo en `infrastructure/persistence/<feature>.typeorm.repository.ts`.

### 3. DTO HTTP (si recibe body)

```ts
// presentation/dto/<action>-<feature>.dto.ts
export class <Action><Feature>Dto {
  @ApiProperty()
  @IsString()
  someField: string;
}
```

Si el endpoint no recibe body (ej: POST /:id/complete), no necesita DTO.

### 4. Mapper DTO → Command

Agregar el método al mapper existente en `presentation/mappers/<feature>-dto.mapper.ts`:

```ts
static to<Action>Command(dto: <Action><Feature>Dto | undefined, params: { id: string; userId: string }): <Action><Feature>Command {
  return { id: params.id, userId: params.userId, ...dto };
}
```

### 5. Controller — agregar el handler

```ts
// En el controller existente

@Post(':id/<action>')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Descripción breve de la acción' })
@ApiOkResponse({ type: <Feature>ResponseDto })
async <action>(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: <Action><Feature>Dto,       // omitir si no hay body
  @CurrentUser() user: { id: string },
) {
  const command = FeatureDtoMapper.to<Action>Command(dto, { id, userId: user.id });
  const result = await this.<action>UseCase.execute(command);
  return FeatureDtoMapper.toResponse(result);
}
```

### 6. Registrar el use case en el module

```ts
// <feature>.module.ts — providers
<Action><Feature>UseCase,
```

Y en el constructor del controller:

```ts
constructor(
  // ...use cases existentes
  private readonly <action>UseCase: <Action><Feature>UseCase,
) {}
```

## Manejo de errores — no repetir código

Los errores de dominio se mapean automáticamente en `common/filters/domain-exception.filter.ts`:
- `NotFoundError` → 404
- `ForbiddenError` → 403
- `ConflictError` → 409
- `ValidationError` → 422

No pongas `try/catch` en los controllers para errores de dominio — el filtro global los captura.

## Swagger — obligatorio en nuevos endpoints

- `@ApiOperation({ summary: '...' })` en el método.
- `@ApiOkResponse` / `@ApiCreatedResponse` con el tipo de respuesta.
- `@ApiNotFoundResponse` si puede lanzar 404.
- Los `@ApiProperty` deben estar en el DTO.

## Patrones comunes

### Endpoint de acción sin body (POST /:id/restore, /:id/complete)

```ts
@Post(':id/restore')
@HttpCode(HttpStatus.OK)
async restore(
  @Param('id', ParseUUIDPipe) id: string,
  @CurrentUser() user: { id: string },
) {
  await this.restoreUseCase.execute({ id, userId: user.id });
}
```

### Endpoint con query params (GET / con filtros)

```ts
// dto/list-<feature>-query.dto.ts
export class List<Feature>QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
```

```ts
@Get()
async list(
  @Query() query: List<Feature>QueryDto,
  @CurrentUser() user: { id: string },
) {
  return this.listUseCase.execute({ userId: user.id, ...query });
}
```

### Endpoint con paginación por cursor

```ts
@Get()
async list(
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  @Query('cursor') cursor?: string,
  @CurrentUser() user?: { id: string },
) {
  return this.listUseCase.execute({ userId: user.id, limit, cursor });
}
```
