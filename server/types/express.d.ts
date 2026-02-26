import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface User {
            id: string;
            username: string;
            email: string;
            kachow_role?: string;
            org_id?: string;
            [key: string]: any;
        }
        interface Request {
            user?: User;
            context?: {
                user: User;
            };
        }
    }
}

export { };
