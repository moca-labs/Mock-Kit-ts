export default class McMockMatcher {
	static match(pattern: string, url: string): Record<string, string> | null {
		const paramNames: string[] = [];
		const regexSource = pattern
			.split("/")
			.map((segment) => {
				const match = /^\{(\w+)\}$/.exec(segment);
				if (!match) return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				paramNames.push(match[1]);
				return "([^/]+)";
			})
			.join("/");

		const path = McMockMatcher.extractPath(url);
		const matched = new RegExp(`^${regexSource}$`).exec(path);
		if (!matched) return null;

		const params: Record<string, string> = {};
		paramNames.forEach((name, index) => {
			params[name] = decodeURIComponent(matched[index + 1]);
		});
		return params;
	}

	private static extractPath(url: string): string {
		try {
			return new URL(url, "http://mock.local").pathname;
		} catch {
			return url.split("?")[0];
		}
	}
}
