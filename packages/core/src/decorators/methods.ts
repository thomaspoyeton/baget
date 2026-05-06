import { METADATA_KEYS } from "../constants";
import {
	getMeta,
	type HttpMethod,
	type RouteMetadata,
	type RouteSchemaInput,
	setMeta,
} from "../types/internal";

// biome-ignore lint/suspicious/noExplicitAny: This is needed for the route handler type
export type RouteHandler = (...args: any[]) => unknown;

export type RouteDecorator = <T extends object, K extends keyof T>(
	target: T,
	propertyKey: K,
) => void;

export const createRouteDecorator =
	(method: HttpMethod) =>
	(path: string = "", schema?: RouteSchemaInput): RouteDecorator =>
	(target, propertyKey) => {
		const ctor = (target as object).constructor as new (
			// biome-ignore lint/suspicious/noExplicitAny: This is needed for the constructor type
			...args: any[]
		) => object;
		const routes = getMeta(METADATA_KEYS.ROUTES, ctor) ?? [];
		const route: RouteMetadata = {
			method,
			path,
			methodName: propertyKey as string | symbol,
			schema,
		};
		setMeta(METADATA_KEYS.ROUTES, [...routes, route], ctor);
	};

export const Get = createRouteDecorator("get");
export const Post = createRouteDecorator("post");
export const Put = createRouteDecorator("put");
export const Patch = createRouteDecorator("patch");
export const Delete = createRouteDecorator("delete");
export const Options = createRouteDecorator("options");
export const Head = createRouteDecorator("head");
