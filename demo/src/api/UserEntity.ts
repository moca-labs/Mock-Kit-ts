import { McEntity } from "@moca-labs/entity-kit-ts";

@McEntity.ENTITY
export class UserEntity extends McEntity.Serializable {
	@McEntity.FIELD(String) id!: string;
	@McEntity.FIELD(String) name!: string;
	@McEntity.FIELD(String, undefined, "") email!: string;
}
