import { registerParamBinding } from "../types/internal";

export const Headers =
	(name?: string): ParameterDecorator =>
	(target, propertyKey, parameterIndex) => {
		if (propertyKey === undefined) {
			throw new Error(
				"[baget] @Headers can only be used on method parameters",
			);
		}
		registerParamBinding(target, propertyKey, parameterIndex, {
			source: "headers",
			name,
		});
	};
