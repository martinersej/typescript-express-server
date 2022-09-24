import type Server from "@/types/Server";
import type { Request, Response } from "express";

const router = require("express").Router();

module.exports = (server: Server) => {
    return {
        auth: false,
        router: () => {
            router.get("/", (req: Request, res: Response) => {
                res.send("Hello World!");
            });

            router.post('/nigga', (req: Request, res: Response) => {
                res.send("nigga");
            });
            
            return router;
        }
    }
}