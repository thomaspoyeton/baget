import { bake } from "@baget/core";
import { UserController } from "./controllers/user-controller";

const app = bake({
	controllers: [UserController],
});

app.listen(3000);
