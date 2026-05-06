import { METADATA_KEYS } from "../constants";
import { type Constructor, setMeta } from "../types/internal";

export const Controller =
	(path: string = ""): (<T extends Constructor>(target: T) => void) =>
	(target) => {
		setMeta(METADATA_KEYS.CONTROLLER, path, target);
	};
