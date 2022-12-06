import { Router } from "express";

export default interface Route {
    auth?: string;
    rateLimit?: {
        windowMs?: number;
        max?: number;
        message?: string;
    }
    router: () => Router;
}