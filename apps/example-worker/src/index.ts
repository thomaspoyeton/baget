import { bake } from "@baget/core";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { UserController } from "./controllers/user-controller";

const app = bake({
	controllers: [UserController],
	elysia: { adapter: CloudflareAdapter },
}).compile();

export default {
	fetch: (request, _env, _ctx) => app.fetch(request),
} satisfies ExportedHandler<Env>;
