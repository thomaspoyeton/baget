import { registerParamBinding } from "../types/internal";

export const Ctx =
	(): ParameterDecorator =>
	(target, propertyKey, parameterIndex) => {
		if (propertyKey === undefined) {
			throw new Error("[baget] @Ctx can only be used on method parameters");
		}
		registerParamBinding(target, propertyKey, parameterIndex, {
			source: "context",
		});
	};
