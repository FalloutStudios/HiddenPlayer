export interface Config {
    auth: {
        host: string;
        port?: number;
        username: string;
    };
    connection: {
        reconnect: {
            enabled: boolean;
            timeout: number;
        };
    };
    logs: {
        enabled: boolean;
        debugMode: boolean;
        latestLog: string;
    };
}