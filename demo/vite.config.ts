import path from "node:path";
import { entityKitPlugin } from "@moca-labs/entity-kit-ts/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [entityKitPlugin(), vue()],
	resolve: {
		alias: {
			"@moca-labs/mock-kit-ts": path.resolve(import.meta.dirname, "../src/index.ts"),
		},
	},
});
