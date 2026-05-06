import type { ElysiaConfig } from "elysia";
import { Elysia, type HTTPMethod } from "elysia";
import { BunAdapter } from "elysia/adapter/bun";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { WebStandardAdapter } from "elysia/adapter/web-standard";
import { METADATA_KEYS } from "./constants";
import { defaultOven } from "./di/container";
import { type Constructor, getMeta, type ParamBinding } from "./types/internal";

export type AdapterName = "bun" | "cloudflare" | "web-standard";

const ADAPTERS = {
	bun: BunAdapter,
	cloudflare: CloudflareAdapter,
	"web-standard": WebStandardAdapter,
} as const satisfies Record<AdapterName, unknown>;

type ElysiaContext = {
	params?: Record<string, string | undefined>;
	query?: Record<string, string | undefined>;
	headers?: Record<string, string | undefined>;
	body?: unknown;
};
// biome-ignore lint/suspicious/noExplicitAny: handlers accept arbitrary user-defined args
type AnyHandler = (...args: any[]) => unknown;

const pluck = (obj: unknown, key: string): unknown =>
	obj && typeof obj === "object"
		? (obj as Record<string, unknown>)[key]
		: undefined;

const extractArg = (ctx: ElysiaContext, binding: ParamBinding): unknown => {
	switch (binding.source) {
		case "params":
			return ctx.params?.[binding.name];
		case "query":
			return binding.name ? ctx.query?.[binding.name] : ctx.query;
		case "body":
			return binding.name ? pluck(ctx.body, binding.name) : ctx.body;
		case "headers":
			return binding.name ? ctx.headers?.[binding.name] : ctx.headers;
		case "context":
			return ctx;
	}
};

const DECORATOR_NAMES = {
	body: "Body",
	query: "Query",
	params: "Param",
	headers: "Headers",
} as const;

const createControllerPlugin = <T extends object>(
	ControllerClass: Constructor<T>,
) => {
	const instance = defaultOven.resolve(ControllerClass);
	const basePath = getMeta(METADATA_KEYS.CONTROLLER, ControllerClass) ?? "";
	const routes = getMeta(METADATA_KEYS.ROUTES, ControllerClass) ?? [];
	const methodParams =
		getMeta(METADATA_KEYS.METHOD_PARAMS, ControllerClass) ?? {};

	return (app: Elysia): Elysia => {
		let internalApp = app;

		for (const route of routes) {
			const handler = (instance as Record<string | symbol, unknown>)[
				route.methodName
			];
			if (typeof handler !== "function") {
				throw new Error(
					`[baget] ${ControllerClass.name}.${String(route.methodName)} is not a function (declared on ${route.method.toUpperCase()} ${basePath}${route.path})`,
				);
			}

			const bound = (handler as AnyHandler).bind(instance);
			const method = route.method.toUpperCase() as HTTPMethod;
			const fullPath = `${basePath}${route.path}`;
			const bindings = methodParams[String(route.methodName)];

			if (bindings) {
				for (const b of bindings) {
					if (!b) continue;
					if (
						(b.source === "body" ||
							b.source === "query" ||
							b.source === "params" ||
							b.source === "headers") &&
						b.name !== undefined &&
						!route.schema?.[b.source]
					) {
						const decoratorName = DECORATOR_NAMES[b.source];
						const verb = `@${method[0]}${method.slice(1).toLowerCase()}`;
						console.warn(
							`[baget] ${ControllerClass.name}.${String(route.methodName)} uses @${decoratorName}("${b.name}") on ${method} ${fullPath} but the route has no ${b.source} schema. ` +
								`Plucking a field from an unvalidated ${b.source} is unsafe — pass a schema as the 2nd arg, e.g. ${verb}("${route.path}", { ${b.source}: t.Object({ "${b.name}": t.String() }) }).`,
						);
					}
				}
			}

			const invoke = bindings
				? (ctx: ElysiaContext) =>
						bound(...bindings.map((b) => (b ? extractArg(ctx, b) : undefined)))
				: (ctx: ElysiaContext) => bound(ctx);

			internalApp = internalApp.route(
				method,
				fullPath,
				invoke,
				route.schema ?? {},
			) as Elysia;
		}

		return internalApp;
	};
};

export interface BakeOptions {
	controllers: ReadonlyArray<Constructor<object>>;
	adapter?: AdapterName;
	elysia?: Omit<ElysiaConfig<"">, "prefix" | "adapter">;
}

export function bake(options: BakeOptions): Elysia {
	const adapter = options.adapter ? ADAPTERS[options.adapter] : undefined;
	let app: Elysia = new Elysia({ ...options.elysia, adapter });
	for (const controller of options.controllers) {
		app = app.use(createControllerPlugin(controller));
	}
	if (options.adapter === "cloudflare") app = app.compile();
	return app;
}

export type { Context, Static, TSchema } from "elysia";
export { t } from "elysia";
export { Body } from "./decorators/body";
export { Controller } from "./decorators/controller";
export { Ctx } from "./decorators/ctx";
export { Headers } from "./decorators/headers";
export { Inject } from "./decorators/inject";
export { Injectable } from "./decorators/injectable";
export {
	Delete,
	Get,
	Head,
	Options,
	Patch,
	Post,
	Put,
} from "./decorators/methods";
export { Param } from "./decorators/param";
export { Query } from "./decorators/query";
export { defaultOven, Oven } from "./di/container";
export type { BagetInference } from "./types/inference";
export type {
	Constructor,
	HttpMethod,
	ParamBinding,
	ParamSource,
	RouteMetadata,
	RouteSchemaInput,
	Token,
} from "./types/internal";
