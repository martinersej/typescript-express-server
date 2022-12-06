import type Server from "@/types/Server";

module.exports = (server: Server) => {
    return {
        enabled: true,
        socket: (...args: any) => {
            console.log("Hello World from Socket.io! " + args)
        }
    }
}