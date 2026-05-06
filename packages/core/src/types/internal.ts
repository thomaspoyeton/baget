import "reflect-metadata";
import type { TSchema } from "elysia";
import { METADATA_KEYS, type MetadataKey } from "../constants";

// biome-ignore lint/suspicious/noExplicitAny: This is needed for the constructor type
export type Constructor<T = object> = new (...args: any[]) => T;
export type AbstractConstructor<T = object> = abstract new (
	// biome-ignore lint/suspicious/noExplicitAny: This is needed for the abstract constructor type
	...args: any[]
) => T;
export type Token<T = unknown> = Constructor<T> | AbstractConstructor<T>;

export const HTTP_METHODS = [
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"options",
	"head",
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface RouteSchemaInput {
	body?: TSchema;
	query?: TSchema;
	params?: TSchema;
	headers?: TSchema;
	response?: TSchema;
}

export interface RouteMetadata {
	method: HttpMethod;
	path: string;
	methodName: string | symbol;
	schema?: RouteSchemaInput;
}

type MetadataPayloads = {
	[METADATA_KEYS.CONTROLLER]: string;
	[METADATA_KEYS.INJECTABLE]: true;
	[METADATA_KEYS.ROUTES]: RouteMetadata[];
	[METADATA_KEYS.INJECT]: Token[];
};

export const getMeta = <K extends MetadataKey>(
	key: K,
	target: object,
): MetadataPayloads[K] | undefined =>
	Reflect.getMetadata(key, target) as MetadataPayloads[K] | undefined;

export const setMeta = <K extends MetadataKey>(
	key: K,
	value: MetadataPayloads[K],
	target: object,
): void => {
	Reflect.defineMetadata(key, value, target);
};
