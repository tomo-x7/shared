export function formatForLog(value: unknown) {
	const seen = new WeakSet();

	function fmt(v: unknown, depth: number): string {
		if (v === null) return "null";
		if (v === undefined) return "undefined";
		const t = typeof v;
		if (t === "string") return JSON.stringify(v);
		if (t === "number" || t === "boolean") return String(v);
		if (t === "bigint") return `${v.toString()}n`;
		if (t === "symbol") return v.toString();
		// biome-ignore lint/complexity/noBannedTypes: Neccessary
		if (t === "function") return `[Function${(v as Function).name ? `: ${(v as Function).name}` : ""}]`;

		if (v instanceof Error) {
			const name = v.name || "Error";
			const msg = v.message || "";
			const stack = v.stack ? `\n${v.stack}` : "";
			// include enumerable/non-enumerable extra props
			const extras = Object.getOwnPropertyNames(v).filter((k) => !["name", "message", "stack"].includes(k));
			const extraText = extras.length ? `\n${fmtObjectProps(v, extras, depth)}` : "";
			return `${name}: ${msg}${stack}${extraText}`;
		}

		if (v instanceof Date) return `Date { ${Number.isNaN(v.getDate()) ? "Invalid Date" : v.toISOString()} }`;
		if (v instanceof RegExp) return v.toString();

		if (Array.isArray(v)) {
			if (seen.has(v)) return "[Circular]";
			if (depth <= 0) return "[Array]";
			seen.add(v);
			const len = Math.min(v.length, 50);
			const items = [];
			for (let i = 0; i < len; i++) items.push(fmt(v[i], depth - 1));
			if (v.length > len) items.push("...");
			seen.delete(v);
			return `[ ${items.join(", ")} ]`;
		}

		if (v instanceof Map) {
			if (seen.has(v)) return "Map { [Circular] }";
			if (depth <= 0) return "Map { ... }";
			seen.add(v);
			const entries = [];
			let i = 0;
			for (const [k, val] of v) {
				if (i++ >= 50) {
					entries.push("...");
					break;
				}
				entries.push(`${fmt(k, depth - 1)} => ${fmt(val, depth - 1)}`);
			}
			seen.delete(v);
			return `Map { ${entries.join(", ")} }`;
		}

		if (v instanceof Set) {
			if (seen.has(v)) return "Set { [Circular] }";
			if (depth <= 0) return "Set { ... }";
			seen.add(v);
			const items = [];
			let i = 0;
			for (const it of v) {
				if (i++ >= 50) {
					items.push("...");
					break;
				}
				items.push(fmt(it, depth - 1));
			}
			seen.delete(v);
			return `Set { ${items.join(", ")} }`;
		}

		// Plain object
		if (t === "object") {
			if (seen.has(v)) return "[Circular]";
			if (depth <= 0) return "[Object]";
			seen.add(v);
			const keys = Object.keys(v);
			const parts = [];
			for (const k of keys) {
				try {
					parts.push(`${k}: ${fmt((v as Record<string, unknown>)[k], depth - 1)}`);
				} catch (e) {
					parts.push(`${k}: [Thrown ${e}]`);
				}
			}
			seen.delete(v);
			return `{ ${parts.join(", ")} }`;
		}

		// Fallback
		try {
			return String(v);
		} catch (e) {
			return Object.prototype.toString.call(v);
		}
	}

	function fmtObjectProps(obj: object, props: string[], depth: number): string {
		const parts = [];
		for (const k of props) {
			try {
				parts.push(`${k}: ${fmt((obj as Record<string, unknown>)[k], depth - 1)}`);
			} catch (e) {
				parts.push(`${k}: [Thrown ${e}]`);
			}
		}
		return `{ ${parts.join(", ")} }`;
	}

	return fmt(value, 3);
}
