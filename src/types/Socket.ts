export default interface Socket {
    enabled?: boolean;
    socket: (...args: any) => Promise<Socket>,
}