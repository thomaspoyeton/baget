import { bake } from "@baget/core";
import { UserController } from "./controllers/user-controller";

const app = bake({
	controllers: [UserController],
	adapter: "cloudflare",
});

export default {
	fetch: (request, _env, _ctx) => app.fetch(request),
} satisfies ExportedHandler<Env>;
