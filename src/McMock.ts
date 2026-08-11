import McMockManager from "./core/McMockManager";
import { DELETE, GET, PATCH, POST, PUT } from "./decorators/McMockMethodDecorator";

const McMock = { GET, POST, PUT, PATCH, DELETE, Manager: McMockManager };

export default McMock;
export { McMock, McMockManager };
