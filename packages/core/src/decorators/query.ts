import { registerParamBinding } from "../types/internal";

export const Query =
	(name?: string): ParameterDecorator =>
	(target, propertyKey, parameterIndex) => {
		if (propertyKey === undefined) {
			throw new Error("[baget] @Query can only be used on method parameters");
		}
		registerParamBinding(target, propertyKey, parameterIndex, {
			source: "query",
			name,
		});
	};
