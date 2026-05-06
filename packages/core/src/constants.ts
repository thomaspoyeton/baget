export const METADATA_KEYS = {
	CONTROLLER: "baget:controller",
	INJECTABLE: "baget:injectable",
	ROUTES: "baget:routes",
	INJECT: "baget:inject",
	METHOD_PARAMS: "baget:method-params",
} as const;

export type MetadataKey = (typeof METADATA_KEYS)[keyof typeof METADATA_KEYS];
