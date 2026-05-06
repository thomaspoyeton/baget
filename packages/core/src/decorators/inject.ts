import { METADATA_KEYS } from "../constants";
import { getMeta, setMeta, type Token } from "../types/internal";

export const Inject =
	<T>(token: Token<T>): ParameterDecorator =>
	(target, _propertyKey, parameterIndex) => {
		const ctor = target as object;
		const existing = getMeta(METADATA_KEYS.INJECT, ctor) ?? [];
		const next: Token[] = [...existing];
		next[parameterIndex] = token;
		setMeta(METADATA_KEYS.INJECT, next, ctor);
	};
