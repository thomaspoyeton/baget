// biome-ignore-all lint/complexity/noBannedTypes: This is needed for the inference type
import type { Constructor } from "./internal";

export type BagetInference<T extends ReadonlyArray<Constructor<object>>> =
	T extends readonly [infer Head, ...infer Tail]
		? Head extends Constructor<object>
			? Tail extends ReadonlyArray<Constructor<object>>
				? InferControllerRoutes<Head> & BagetInference<Tail>
				: InferControllerRoutes<Head>
			: {}
		: {};

type InferControllerRoutes<_C extends Constructor<object>> = {};
