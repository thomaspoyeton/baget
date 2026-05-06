# 🥖 baget

baget is a framework for building clean, maintainable, and scalable APIs.

A decorator-driven framework on top of [Elysia](https://elysiajs.com/), inspired by NestJS. Same source runs on Bun and Cloudflare Workers.

## Features

- **Decorators** — `@Controller`, `@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`/`@Options`/`@Head`, and parameter decorators `@Param`, `@Query`, `@Body`, `@Headers`, `@Ctx`.
- **Dependency injection** — `@Injectable` services, `@Inject(Token)` constructor injection. Singleton scope by default. No reliance on `emitDecoratorMetadata`, so DI works identically under Bun's bundler, esbuild, and wrangler.
- **Schema validation** — TypeBox via re-exported `t` and `Static`. Define a schema once, derive the TS type from it, attach it to the route. Invalid requests get a 422 from Elysia before your handler runs.
- **Cross-runtime** — `bake({ adapter: "cloudflare" })` swaps Elysia's adapter and pre-compiles routes so V8 isolates accept them. No code change in your controllers.
- **Boot-time guardrails** — when a method extracts a named field without a matching route schema (`@Body("name")` with no `body` schema, etc.), baget warns at boot with a copy-pasteable fix template.
- **Strong types throughout** — discriminated metadata, exhaustive switches, no `any` in the public surface.

## Install

```bash
bun add @baget/core
```

`tsconfig.json` (only `experimentalDecorators` is required — baget polyfills `reflect-metadata` and uses explicit `@Inject` tokens, not bundler-emitted metadata):

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "strict": true
  }
}
```

## Quick start

```ts
// services/user.ts
import { Injectable } from "@baget/core";

@Injectable()
export class UserService {
  async getUser(id: string) {
    return { id, name: "Alice" };
  }
}
```

```ts
// schemas/user.ts
import { type Static, t } from "@baget/core";

export const GetUserParams = t.Object({ id: t.String({ minLength: 1 }) });
export type GetUserParams = Static<typeof GetUserParams>;
```

```ts
// controllers/user.ts
import { Controller, Get, Inject, Param } from "@baget/core";
import { GetUserParams } from "../schemas/user";
import { UserService } from "../services/user";

@Controller("/users")
export class UserController {
  constructor(@Inject(UserService) private readonly users: UserService) {}

  @Get("/:id", { params: GetUserParams })
  getUser(@Param("id") id: string) {
    return this.users.getUser(id);
  }
}
```

```ts
// index.ts
import { bake } from "@baget/core";
import { UserController } from "./controllers/user";

const app = bake({ controllers: [UserController] });
app.listen(3000);
```

## Decorators

| Decorator | Target | Behaviour |
|---|---|---|
| `@Controller(path)` | class | Mounts the controller's routes under `path` |
| `@Get(path, schema?)` etc. | method | Registers a route. `schema` is `RouteSchemaInput` (`body`, `query`, `params`, `headers`, `response`) |
| `@Injectable()` | class | Marks the class as resolvable by the DI container |
| `@Inject(Token)` | constructor param | Resolves `Token` from the container |
| `@Param(name)` | method param | Reads `ctx.params[name]` |
| `@Query(name?)` | method param | Reads `ctx.query[name]`, or the whole query record if no name |
| `@Body(name?)` | method param | Reads `ctx.body[name]`, or the whole body if no name |
| `@Headers(name?)` | method param | Reads `ctx.headers[name]`, or the whole headers record if no name |
| `@Ctx()` | method param | Receives the full Elysia context |

A method with no parameter decorators receives `ctx` directly:

```ts
@Get("/legacy")
legacy(ctx: Context) { return { url: ctx.request.url }; }
```

## Schemas

Define schemas with TypeBox `t.*`, derive types with `Static`, and attach them to routes for runtime validation:

```ts
import { type Static, t } from "@baget/core";

export const CreateUserBody = t.Object({
  name: t.String({ minLength: 1 }),
  age: t.Optional(t.Number()),
});
export type CreateUserBody = Static<typeof CreateUserBody>;
```

```ts
@Post("/", { body: CreateUserBody })
create(@Body() body: CreateUserBody, @Body("name") name: string) {
  return { received: body, name };
}
```

`@Body("name") name: string` is now truthful: Elysia rejects malformed bodies with HTTP 422 before the handler runs.

When a route plucks a named field without a schema for that source, boot emits a warning:

```
[baget] UserController.create uses @Body("name") on POST /users but the route has no body schema.
Plucking a field from an unvalidated body is unsafe — pass a schema as the 2nd arg, e.g.
@Post("/", { body: t.Object({ "name": t.String() }) }).
```

The check covers `body`, `query`, `params`, and `headers`. `@Ctx()` and unnamed `@Body()` / `@Query()` / `@Headers()` are not enforced (no claim is being made about the shape).

## Dependency injection

Mark anything you want to inject with `@Injectable()`:

```ts
@Injectable()
class Logger {
  log(msg: string) { console.log(`[log] ${msg}`); }
}

@Injectable()
class UserRepo {
  constructor(@Inject(Logger) private readonly logger: Logger) {}
  list() { this.logger.log("listing users"); return []; }
}
```

Controllers are auto-resolved by `bake()`. Manual resolution and provider customisation go through `Oven`:

```ts
import { defaultOven, Oven } from "@baget/core";

// Provide an instance directly (skip construction)
defaultOven.provide(Logger, new Logger());

// Provide a factory (called once, result cached)
defaultOven.factory(UserRepo, (oven) => new UserRepo(oven.resolve(Logger)));

// Or use a fresh container
const oven = new Oven();
oven.factory(Database, () => new PostgresDatabase(process.env.DB_URL!));
```

`@Inject` is required on every constructor parameter you want injected — relying on `design:paramtypes` from `emitDecoratorMetadata` is intentionally not supported, since esbuild and other bundlers don't emit it. Forgetting `@Inject` throws at boot with the parameter index and class name.

## Cloudflare Workers

```ts
// src/index.ts
import { bake } from "@baget/core";
import { UserController } from "./controllers/user";

const app = bake({
  controllers: [UserController],
  adapter: "cloudflare",
});

export default {
  fetch: (req, _env, _ctx) => app.fetch(req),
} satisfies ExportedHandler<Env>;
```

Setting `adapter: "cloudflare"` does two things:
1. Swaps Elysia's adapter for `CloudflareAdapter`.
2. Calls `.compile()` at module init so all `new Function(...)` paths inside Elysia's compose layer execute while V8 still allows them. Without this, the first request hits `EvalError: Code generation from strings disallowed`.

No `elysia` import in your worker. The adapter is handled internally; you keep using the same controllers, schemas, and services as on Bun.

## bake() options

```ts
interface BakeOptions {
  controllers: ReadonlyArray<Constructor<object>>;
  adapter?: "bun" | "cloudflare" | "web-standard";
  elysia?: Omit<ElysiaConfig<"">, "prefix" | "adapter">;
}
```

- `controllers` — classes decorated with `@Controller`. They're resolved through `defaultOven`.
- `adapter` — picks the Elysia adapter. Omit for the default (`bun` on Bun, `web-standard` elsewhere).
- `elysia` — passthrough config. `prefix` and `adapter` are excluded since baget owns them.

## Performance

A controller with one of each parameter decorator + schema validation runs within ~3% of equivalent vanilla Elysia code on read paths and within ~14% on a write path with body validation. The remaining gap lives in Elysia's AOT compose layer (it can inline `({ body }) => ...` handlers but not opaque closures), not in baget's runtime. ~117k req/s on a single Bun process for the heaviest validated POST route in the repo's example app.

## Project layout (recommended)

```
src/
  controllers/      # @Controller classes
  services/         # @Injectable classes
  schemas/          # TypeBox schemas + Static types
  index.ts          # bake() + listen
```

The `apps/example` and `apps/example-worker` directories in this repo follow this layout.

## Status

Early-stage. The public API is small but may still change. Issues and pull requests welcome.
