import { Controller, Get, Inject, Post } from "@baget/core";
import { UserService } from "../services/user-service";

@Controller("/users")
export class UserController {
	constructor(@Inject(UserService) private readonly userService: UserService) {}

	@Get("/")
	async getUsers() {
		return this.userService.getUsers();
	}

	@Post("/")
	async createUser() {
		return this.userService.createUser();
	}
}
