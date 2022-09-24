import { PrismaClient } from "@prisma/client";

export default interface Server {
    database: PrismaClient,
    environment: 'development' | 'production',
}