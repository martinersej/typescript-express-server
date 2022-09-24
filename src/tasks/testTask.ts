import type Server from "@/types/Server";

module.exports = (server: Server) => {
    return {
        name: "Test Task",
        enabled: false,
        cron: "* * * * *",
        run: async () => {
            console.log("Test Task Ran");
        }
    }
};