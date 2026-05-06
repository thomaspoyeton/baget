import { Injectable } from "@baget/core";

@Injectable()
export class UserService {
	async getUsers() {
		return { message: "users fetched (worker)" };
	}

	async createUser() {
		return { message: "user created (worker)" };
	}
}
