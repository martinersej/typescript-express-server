
export default interface Authentication {
    enabled: boolean,
    run: () => Promise<any>;
}