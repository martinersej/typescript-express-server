// create the http server
const express = require('express');
const http = require('http');
const app = express();
const httpServer = http.createServer(app);

const bodyParser = require('body-parser');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('./utils/cors'));

const { getFiles, loadFile, getRouteName } = require('./utils/files');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// import types
import type Task from './types/Task';
import type Server from './types/Server';
import type Route from './types/Route';
import Socket from './types/Socket';
import fs from 'fs';

// load environment variables
require('dotenv').config();
(async () => {
    console.log('\x1b[32mstart\x1b[0m Express Server')
    console.log('\x1b[32mstart\x1b[0m Prisma Client')
    await prisma.$connect();

    // create the server
    const server: Server = {
        database: prisma,
        environment: process.env.NODE_ENV == 'production' ? 'production' : 'development',
    }

    // load authentications
    console.log();
    console.log('\x1b[36mi' + '\x1b[0m Loading authentications');
    var authenticationPaths = getFiles('./src/authentications', '.ts');
    let authentications: any = {};
    for(var i = 0; i < authenticationPaths.length; i++) {
        var authenticationPath = authenticationPaths[i];
        // @ts-ignore
        let authentication: Authentication = loadFile<Authentication>(`${authenticationPath}`, server);
        let authenticationName = getRouteName(authenticationPath.replace('./src/authentications', ''));
        if(authentication.enabled) authentications[authenticationPath.replace('./src/authentications/', '').replace('/', '.').replace('.ts', '')] = authentication;
        console.log('\x1b[2m'+(i == authenticationPaths.length-1 ? '└─ ' : '├─ ') + '\x1b[0m' +authenticationName + (authentication.enabled ? ` \x1b[32m(enabled)\x1b[0m` : ' \x1b[31m(disabled)\x1b[0m'));
    }
    console.log();
        
    // load routes
    console.log('\x1b[36mi' + '\x1b[0m Loading routes');
    var routePaths = getFiles('./src/routes', '.ts');

    for(var i = 0; i < routePaths.length; i++) {
        var routePath = routePaths[i];
        // @ts-ignore
        let route: Route = loadFile<Route>(`${routePath}`, server);
        let routeName = getRouteName(routePath.replace('./src/routes', ''));
        let router = route.router();
        if (route.rateLimit) {
            var rateLimiter = rateLimit({
                windowMs: (route.rateLimit.windowMs ? route.rateLimit.windowMs : 5)*1000,
                max: route.rateLimit.max ? route.rateLimit.max : 50,
                message: route.rateLimit.message ? route.rateLimit.message : 'Too many requests from this IP, please try again later..'
            })
        }
        if (route.rateLimit && authentications[route.auth ? route.auth : '']?.enabled) app.use(routeName, rateLimiter, authentications[route.auth ? route.auth : ''].run, router);
        else if (authentications[route.auth ? route.auth : '']?.enabled && !route.rateLimit) app.use(routeName, authentications[route.auth ? route.auth : ''].run, router);
        else if (!authentications[route.auth ? route.auth : '']?.enabled && route.rateLimit) app.use (routeName, rateLimiter, router);
        else app.use(routeName, router);

        console.log('\x1b[2m ○ \x1b[0m\x1b[37m' + (routeName == '/' ? routeName : routeName) + (routeName == '/' ? ' \x1b[3m\x1b[35m(index)' : '') + '\x1b[0m')
        for(var j = 0; j < router.stack.length; j++) {
            var stack = router.stack[j];
            
            let routeMethods = stack.route.methods
            let routeMethod = routeMethods._all ? 'ALL' : routeMethods.get ? '\x1b[32mGET' : routeMethods.post ? '\x1b[34mPOST' : routeMethods.put ? '\x1b[33mPUT' : routeMethods.delete ? '\x1b[31mDELETE' : routeMethods.options ? 'OPTIONS' : 'UNKNOWN';
            
                console.log('\x1b[2m'+(j == router.stack.length-1 ? ' └─ ' : ' ├─ ') + `\x1b[0m${routeMethod}\x1b[0m - ${stack.route.path}` + (stack.route.path == '/' ? ' \x1b[3m\x1b[35m(index)' : '') + '\x1b[0m');
        }
        console.log();
    }
    
    // load the sockets
    if (JSON.parse(process.env.SOCKET_ENABLED ? process.env.SOCKET_ENABLED : 'false')) {
        console.log('\x1b[36mi' + '\x1b[0m Loading sockets');
        const io = require('socket.io')(httpServer);
        var socketPaths = getFiles('./src/sockets', '.ts');
        var namespaces = socketPaths.map((x: string) => getRouteName(x));
        for(var i = 0; i < namespaces.length; i++) {
            var socketPath = namespaces[i];
            let socketName = socketPath.replace('/src/sockets', '');
            // @ts-ignore
            let _socket: Socket = loadFile<Socket>(`.${socketPath}`, server, io);
            console.log('\x1b[2m'+(i == socketPaths.length-1 ? '└─ ' : '├─ ') + '\x1b[0m' +socketName + (_socket.enabled ? ' \x1b[32m(enabled)\x1b[0m' : ' \x1b[31m(disabled)\x1b[0m'));
            io.of(socketName).on('connection', async (socket: any) => {
                socketPaths.forEach((_socketPath: string) => {
                    let socketFile = _socketPath.split('/').pop()
                    // @ts-ignore
                    let _socket: Socket = loadFile<Socket>(`${_socketPath}`, server, io);
                    if (_socket.enabled) socket.on(socketFile === 'index.ts' && getRouteName(_socketPath) === socketPath ? '/' : socketFile?.slice(0, -3), async (...args: any) => {await _socket.socket(...args)});
                });
            })
        }
        console.log();
    }

    // load the tasks
    if (JSON.parse(process.env.TASK_ENABLED ? process.env.TASK_ENABLED : 'false')) {
        console.log('\x1b[36mi' + '\x1b[0m Loading tasks');
        var taskPaths = getFiles('./src/tasks', '.ts');
        for(var i = 0; i < taskPaths.length; i++) {
            var taskPath = taskPaths[i];
            // @ts-ignore
            let task: Task = loadFile<Task>(`${taskPath}`, server);
            if(task.enabled) cron.schedule(task.cron, async () => await task.run());
            console.log('\x1b[2m'+(i == taskPaths.length-1 ? '└─ ' : '├─ ') + '\x1b[0m' +task.name + (task.enabled ? ` \x1b[32m(${task.cron})` : ' \x1b[31m(disabled)\x1b[0m'));
        }
        console.log();
    }

    httpServer.listen(process.env.PORT || 3000, () => {
        console.log('\x1b[32m√'+ '\x1b[0m' +' Express server is running on \x1b[36m' + (process.env.NODE_ENV == 'development' ? 'http://localhost:'+(process.env.PORT || 3000) : process.env.DOMAIN)+'\x1b[0m');
    });
})();