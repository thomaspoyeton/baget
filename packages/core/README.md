# @baget/core

The runtime core of [baget](https://github.com/) — decorators, dependency injection, schema validation, and the `bake()` entrypoint that turns a list of controller classes into an Elysia app.

For full documentation, examples, and the Cloudflare Workers guide, see the [project README](../../README.md).

## Install

```bash
bun add @baget/core
```

`tsconfig.json` needs `experimentalDecorators: true`. `emitDecoratorMetadata` is **not** required.

## At a glance

```ts
import { bake, Controller, Get, Inject, Injectable, Param, t, type Static } from "@baget/core";

@Injectable()
class UserService {
  getUser(id: string) { return { id, name: "Alice" }; }
}

const GetUserParams = t.Object({ id: t.String({ minLength: 1 }) });

@Controller("/users")
class UserController {
  constructor(@Inject(UserService) private readonly users: UserService) {}

  @Get("/:id", { params: GetUserParams })
  getUser(@Param("id") id: string) { return this.users.getUser(id); }
}

bake({ controllers: [UserController] }).listen(3000);
```

## Exports

- **Decorators**: `Controller`, `Get`, `Post`, `Put`, `Patch`, `Delete`, `Options`, `Head`, `Param`, `Query`, `Body`, `Headers`, `Ctx`, `Injectable`, `Inject`
- **Runtime**: `bake`, `Oven`, `defaultOven`
- **Schema toolkit** (re-exported from Elysia): `t`, `Static`, `TSchema`, `Context`
- **Types**: `Constructor`, `Token`, `HttpMethod`, `RouteMetadata`, `RouteSchemaInput`, `ParamBinding`, `ParamSource`, `AdapterName`, `BagetInference`

See the [root README](../../README.md) for the full guide.
