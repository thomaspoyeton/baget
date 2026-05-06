import type { ElysiaConfig } from "elysia";
import { Elysia, type HTTPMethod } from "elysia";
import { METADATA_KEYS } from "./constants";
import { defaultOven } from "./di/container";
import { type Constructor, getMeta } from "./types/internal";

type AnyHandler = (ctx: unknown) => unknown;

const createControllerPlugin = <T extends object>(
	ControllerClass: Constructor<T>,
) => {
	const instance = defaultOven.resolve(ControllerClass);
	const basePath = getMeta(METADATA_KEYS.CONTROLLER, ControllerClass) ?? "";
	const routes = getMeta(METADATA_KEYS.ROUTES, ControllerClass) ?? [];

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

			internalApp = internalApp.route(
				method,
				fullPath,
				(ctx) => bound(ctx),
				route.schema ?? {},
			) as Elysia;
		}

		return internalApp;
	};
};

export interface BakeOptions {
	controllers: ReadonlyArray<Constructor<object>>;
	elysia?: Omit<ElysiaConfig<"">, "prefix">;
}

export function bake(options: BakeOptions): Elysia {
	let app: Elysia = new Elysia(options.elysia);
	for (const controller of options.controllers) {
		app = app.use(createControllerPlugin(controller));
	}
	return app;
}

export { Controller } from "./decorators/controller";
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
export { defaultOven, Oven } from "./di/container";
export type { BagetInference } from "./types/inference";
export type {
	Constructor,
	HttpMethod,
	RouteMetadata,
	RouteSchemaInput,
	Token,
} from "./types/internal";
