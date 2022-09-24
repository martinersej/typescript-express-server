// create the http server
const express = require("express");
const http = require("http");
const app = express();
const httpServer = http.createServer(app);

const bodyParser = require("body-parser");
const cron = require("node-cron");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("./utils/cors"));

const { getFiles, loadFile, getRouteName } = require('./utils/files');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// import types
import type Task from "./types/Task";
import type Server from "./types/Server";
import type Route from "./types/Route";

// load environment variables
require("dotenv").config();
(async () => {
    console.log("\x1b[32mstart\x1b[0m Express Server")
    console.log("\x1b[32mstart\x1b[0m Prisma Client")
    await prisma.$connect();

    // create the server
    const server: Server = {
        database: prisma,
        environment: process.env.NODE_ENV == "production" ? "production" : "development",
    }
    
    // load routes
    console.log();
    console.log("\x1b[36mi" + "\x1b[0m Loading routes");
    var routePaths = getFiles('./src/routes', ".ts");

    for(var i = 0; i < routePaths.length; i++) {
        var routePath = routePaths[i];
        // @ts-ignore
        let route: Route = loadFile<Route>(`${routePath}`, server);
        let routeName = getRouteName(routePath.replace('./src/routes', ''));
        let router = route.router();

        app.use(routeName, router);

        console.log("\x1b[2m ○ \x1b[0m\x1b[37m" + (routeName == '/' ? routeName : routeName.slice(0, -1)) + (routeName == '/' ? " \x1b[3m\x1b[35m(index)" : "") + "\x1b[0m")
        for(var j = 0; j < router.stack.length; j++) {
            var stack = router.stack[j];
            
            //let _routePath = stack.route.path == '/' ? routeName : `${routeName}${stack.route.path.slice(1)}/`
            let routeMethods = stack.route.methods
            let routeMethod = routeMethods._all ? 'ALL' : routeMethods.get ? '\x1b[32mGET' : routeMethods.post ? '\x1b[34mPOST' : routeMethods.put ? '\x1b[33mPUT' : routeMethods.delete ? '\x1b[31mDELETE' : routeMethods.options ? 'OPTIONS' : 'UNKNOWN';
            
            console.log("\x1b[2m"+(j == router.stack.length-1 ? " └─ " : " ├─ ") + `\x1b[0m${routeMethod}\x1b[0m - ${stack.route.path}` + (stack.route.path == '/' ? " \x1b[3m\x1b[35m(index)" : "") + "\x1b[0m");
        }
        console.log();
    }

    // load the tasks
    console.log("\x1b[36mi" + "\x1b[0m Loading tasks");
    var taskPaths = getFiles("./src/tasks", ".ts");
    for(var i = 0; i < taskPaths.length; i++) {
        var taskPath = taskPaths[i];
        // @ts-ignore
        let task: Task = loadFile<Task>(`${taskPath}`, server);
        if(task.enabled) cron.schedule(task.cron, async () => await task.run());
        console.log("\x1b[2m"+(i == taskPaths.length-1 ? "└─ " : "├─ ") + "\x1b[0m" +task.name + (task.enabled ? ` \x1b[32m(${task.cron})` : " \x1b[31m(disabled)\x1b[0m"));
    }
    httpServer.listen(process.env.PORT || 3000, () => {
        console.log();
        console.log("\x1b[32m√"+ "\x1b[0m" +" Express server is running on \x1b[36m" + (process.env.NODE_ENV == "development" ? "http://localhost:"+(process.env.PORT || 3000) : process.env.DOMAIN)+"\x1b[0m");
    });
})();