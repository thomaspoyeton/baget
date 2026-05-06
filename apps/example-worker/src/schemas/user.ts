import { type Static, t } from "@baget/core";

export const CreateUserBody = t.Object({
	name: t.String({ minLength: 1 }),
	age: t.Optional(t.Number()),
});
export type CreateUserBody = Static<typeof CreateUserBody>;

export const ListUsersQuery = t.Object({
	limit: t.Optional(t.Number()),
});
export type ListUsersQuery = Static<typeof ListUsersQuery>;

export const GetUserParams = t.Object({
	id: t.String({ minLength: 1 }),
});
export type GetUserParams = Static<typeof GetUserParams>;

export const WhoamiHeaders = t.Object({
	"user-agent": t.String(),
});
export type WhoamiHeaders = Static<typeof WhoamiHeaders>;
