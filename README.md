# What is this?
This is simple the boilerplate for my projects backend. It's a simple way to get started with a new project.

# How to use it?
1. Clone the repo
2. Run `yarn install`
3. Run `yarn run dev` to start the server
4. Setup `prisma/schema.prisma` and run `yarn run prisma:deploy` to deploy the database


# How to create a route?
All you have to do is create a new `.ts` file in `src/routes` and the route
will automatically be loaded by the server.

Example: The file `src/routes/foo/bar/index.ts` gets mapped to the route `/foo/bar`,
and the file `src/routes/foo/bar/baz.ts` gets mapped to the route `/foo/bar/baz`.

```ts
import type Server from "@/types/Server";
import type { Request, Response } from "express";

const router = require("express").Router();

module.exports = (server: Server) => {
    return {
        router: () => {
            router.get("/", (req: Request, res: Response) => {
                res.send("Hello World!");
            });
            
            return router;
        }
    }
}
```

# How to create a task?
That is also very simple. Just create a new `.ts` file in `src/tasks` and the task
will automatically be loaded by `Node-Cron`.

```ts
import type Server from "@/types/Server";

module.exports = (server: Server) => {
    return {
        name: "Example Tast",
        enabled: true,
        cron: "* * * * *",
        run: async () => {
            console.log("This task runs every minute.");
        }
    }
};
```

# What is the `server` object?
The server object is created in `src/index.ts` and is passed to all the routes and tasks. By default it only contains the prisma client. But you can add more stuff to it if you want.