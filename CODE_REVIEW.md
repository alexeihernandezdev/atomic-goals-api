# Code Review — Atomic Goals API

**Fecha:** 2026-05-29  
**Stack:** NestJS + TypeORM + PostgreSQL  
**Revisado por:** Claude Code

---

## P0 — Seguridad: Falta de validación de ownership

### 1. `GoalInstancesController` no valida usuario en GET y PATCH

**Archivos afectados:**
- `src/modules/goals/presentation/goal-instances.controller.ts:91-113`
- `src/modules/goals/application/use-cases/get-goal-instance.use-case.ts:19-23`
- `src/modules/goals/application/use-cases/update-goal-instance-status.use-case.ts:21-31`

`GET /goal-instances/:id` y `PATCH /goal-instances/:id` solo reciben el ID de la instancia, sin `userId`. `GetGoalInstanceUseCase` llama a `instanceRepo.findById(id)` sin ningún filtro de propietario. Cualquier usuario autenticado puede leer o modificar la instancia de otro usuario si conoce su UUID.

Contraste: `POST /goal-instances/:id/complete` (línea 120) sí usa `@CurrentUser()` y pasa `userId` — la inconsistencia es evidente dentro del mismo controlador.

`IGoalInstanceRepository` tampoco expone un método `findByIdAndUserId`, por lo que el fix requiere extender también el repositorio.

```ts
// Actual — sin scope de usuario
async getOne(@Param('id') id: string) {
  const instance = await this.getGoalInstanceUseCase.execute({ id });
  ...
}

// Correcto
async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
  const instance = await this.getGoalInstanceUseCase.execute({ id, userId: user.userId });
  ...
}
```

---

### 2. `StepsController` no valida usuario en ningún endpoint

**Archivo:** `src/modules/steps/presentation/steps.controller.ts:118-188`

Todos los endpoints GET, PATCH (metadata y progress), DELETE, restore y reorder reciben solo el step ID. `IStepRepository` solo tiene `findById(id)` — sin filtro de propietario. Un usuario puede operar sobre cualquier step de cualquier otro usuario.

El ownership se puede inferir transitivamente: `step → goalInstance → goal → userId`, pero esa validación no existe en ninguna capa hoy.

---

### 3. Dashboard: fechas del calendario no validadas

**Archivo:** `src/modules/dashboard/presentation/dashboard.controller.ts:75-77`

```ts
from: new Date(from),  // from es string del query sin validar
to: new Date(to),
```

Si `from` o `to` son cadenas inválidas (`"foo"`, `"undefined"`), `new Date()` retorna `Invalid Date` que se pasa silenciosamente a las queries SQL. TypeORM puede lanzar un error críptico o ejecutar la query con `NaN`.

**Fix:** validar antes de pasar al use case.

```ts
const fromDate = new Date(from);
const toDate = new Date(to);
if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
  throw new BadRequestException('from and to must be valid ISO date strings');
}
```

---

## P1 — Inconsistencias de arquitectura

### 4. `toStepResponse` duplicada en dos controladores

**Archivos:**
- `src/modules/goals/presentation/goal-instances.controller.ts:28-62`
- `src/modules/steps/presentation/steps.controller.ts:30-76`

La función `toStepResponse` está copiada casi idéntica en ambos controladores. La versión de `StepsController` incluye campos adicionales (`goalInstanceId`, `startDate`, `endDate`, `estimatedDurationMinutes`, `createdAt`, `updatedAt`) que la de `GoalInstancesController` omite — divergencia silenciosa.

**Fix:** extraer a `src/modules/steps/presentation/mappers/step-response.mapper.ts` y usar una sola implementación completa.

---

### 5. `toInstanceResponse` duplicada en dos controladores

**Archivos:**
- `src/modules/goals/presentation/goals.controller.ts:31-43`
- `src/modules/goals/presentation/goal-instances.controller.ts:64-76`

Misma función, mismo módulo. Debería vivir en un archivo de mapper compartido dentro del módulo goals.

---

### 6. `CategoryMapper.toPersistence` retorna `Partial<CategoryOrmEntity>`

**Archivo:** `src/modules/categories/infrastructure/persistence/category.mapper.ts:20`

Todos los demás mappers (`GoalMapper`, `StepMapper`) retornan el tipo completo de la entidad ORM. `CategoryMapper.toPersistence` retorna `Partial<>`, lo que significa que `createdAt` y `updatedAt` no se incluyen en el objeto — TypeORM los gestiona, pero el tipo miente sobre qué se está persistiendo.

---

### 7. `limit` sin validación de rango en activity y dashboard

**Archivos:**
- `src/modules/activity/presentation/activity.controller.ts:34`  
- `src/modules/dashboard/presentation/dashboard.controller.ts:90`

```ts
limit: limit ? parseInt(limit, 10) : 20,  // puede ser 0, negativo, o 999999
```

No hay cota mínima ni máxima. Un valor de `limit=0` devuelve 0 resultados sin error. Un `limit=100000` puede hundir la DB.

**Fix:** añadir un guard explícito o usar un DTO con `@IsInt() @Min(1) @Max(100)`.

---

## P2 — Calidad de código

### 8. `userId` expuesto en respuesta de activity

**Archivo:** `src/modules/activity/presentation/activity.controller.ts:41`

```ts
userId: log.userId.value,  // el userId del usuario ya está implícito en el JWT
```

El `userId` del usuario autenticado no aporta información al cliente y expone un dato sensible innecesariamente. La respuesta ya está scoped al usuario por el JWT.

---

### 9. Validación de `range` inline en lugar de DTO

**Archivo:** `src/modules/dashboard/presentation/dashboard.controller.ts:43-47`

```ts
const validRange = (['week', 'month', 'year'] as const).includes(range as ...)
  ? (range as 'week' | 'month' | 'year')
  : 'week';
```

Esta lógica de validación y fallback silencioso pertenece a un DTO con `@IsEnum`. Un valor inválido silenciosamente se convierte en `'week'` sin avisar al cliente.

---

### 10. Upcoming devuelve items duplicados para goals con varias instancias

**Archivo:** `src/modules/dashboard/infrastructure/read-model/dashboard.typeorm-read-model.ts:211-218`

La query de goals en `getUpcoming` hace `LEFT JOIN goal_instances` sin `LIMIT 1` en el JOIN. Si un goal tiene múltiples instancias IN_PROGRESS, aparecerá duplicado en los resultados antes del `slice(0, limit)` final.

```sql
-- Puede retornar el mismo goal N veces si tiene N instancias activas
LEFT JOIN goal_instances gi ON gi."goalId" = g.id AND gi.status = 'IN_PROGRESS'
```

**Fix:** usar una subquery o `DISTINCT ON (g.id)`.

---

### 11. `getUpcoming` aplica `limit` dos veces

**Archivo:** `src/modules/dashboard/infrastructure/read-model/dashboard.typeorm-read-model.ts:218, 228, 254-255`

La query SQL ya aplica `LIMIT $3` a goals y a steps por separado. Luego el código hace `.slice(0, limit)` sobre el array combinado. El resultado real puede tener hasta `2 * limit` elementos antes del slice, y el slice final mezcla goals y steps sin garantía de distribución equitativa.

---

## Resumen priorizado

| # | Problema | Severidad | Esfuerzo |
|---|---|---|---|
| 1 | `GoalInstancesController` GET/PATCH sin validación de ownership | **Seguridad / P0** | Medio |
| 2 | `StepsController` completo sin validación de ownership | **Seguridad / P0** | Medio |
| 3 | Dashboard: `new Date(from/to)` sin validar | **Seguridad / P0** | Bajo |
| 4 | `toStepResponse` duplicada con campos divergentes | **P1** | Bajo |
| 5 | `toInstanceResponse` duplicada en mismo módulo | **P1** | Bajo |
| 6 | `limit` sin cota en activity y dashboard | **P1** | Bajo |
| 7 | `CategoryMapper.toPersistence` retorna `Partial<>` inconsistente | **P2** | Trivial |
| 8 | `userId` expuesto innecesariamente en respuesta de activity | **P2** | Trivial |
| 9 | Validación de `range` inline, debería ser DTO con `@IsEnum` | **P2** | Bajo |
| 10 | Duplicados en `getUpcoming` por multi-instancia en JOIN | **P2** | Bajo |
| 11 | `limit` aplicado dos veces en `getUpcoming` | **P2** | Bajo |
