import { METADATA_KEYS } from "../constants";
import { type Constructor, setMeta } from "../types/internal";

export const Injectable =
	(): (<T extends Constructor>(target: T) => void) => (target) => {
		setMeta(METADATA_KEYS.INJECTABLE, true, target);
	};
