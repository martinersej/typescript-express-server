import type Server from "@/types/Server";
import type { NextFunction, Request, Response } from "express";

module.exports = (server: Server) => {
    return {
        enabled: true,
        run: (req: Request, res: Response, next: NextFunction) => {
                console.log('Do auth check here.');
                next();
            }
        }
}