import {
	Body,
	type Context,
	Controller,
	Ctx,
	Get,
	Headers,
	Inject,
	Param,
	Post,
	Query,
} from "@baget/core";
import {
	CreateUserBody,
	GetUserParams,
	ListUsersQuery,
	WhoamiHeaders,
} from "../schemas/user";
import { UserService } from "../services/user-service";

@Controller("/users")
export class UserController {
	constructor(@Inject(UserService) private readonly userService: UserService) {}

	@Get("/", { query: ListUsersQuery })
	async getUsers(@Query("limit") limit?: number) {
		return { ...(await this.userService.getUsers()), limit: limit ?? null };
	}

	@Get("/:id", { params: GetUserParams })
	async getUser(@Param("id") id: string) {
		return this.userService.getUser(id);
	}

	@Get("/whoami/agent", { headers: WhoamiHeaders })
	whoamiAgent(@Headers("user-agent") ua: string) {
		return { ua };
	}

	@Get("/whoami/raw")
	whoami(@Ctx() ctx: Context) {
		return {
			method: ctx.request.method,
			url: ctx.request.url,
			ua: ctx.request.headers.get("user-agent"),
		};
	}

	@Post("/", { body: CreateUserBody })
	async createUser(@Body() body: CreateUserBody, @Body("name") name: string) {
		return { received: body, name };
	}
}
