import type Server from "@/types/Server";

module.exports = (server: Server) => {
    return {
        name: "Example task",
        enabled: true,
        cron: "* * * * *",
        run: async () => {
            console.log("This task runs every minute.");
        }
    }
};