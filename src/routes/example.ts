import type Server from "@/types/Server";
import type { Request, Response } from "express";

const router = require("express").Router();

module.exports = (server: Server) => {
    return {
        auth: 'example',
        rateLimit: {
            max: 4
        },
        router: () => {
            router.get("/", (req: Request, res: Response) => {
                res.send('Hello World!');
            });
            return router;
        }
    }
}