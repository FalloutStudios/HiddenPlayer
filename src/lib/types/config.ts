export interface Config {
    auth: {
        host: string;
        port?: number;
        username: string;
        version?: string|false;
    };
    connection: {
        reconnect: {
            enabled: boolean;
            timeout: number;
        };
    };
    messages: {
        allowChatsInTerminal: boolean;
        loginMessages: {
            enabled: boolean;
            delayTimeout: number;
            messages: string[];
        }
    };
    logs: {
        enabled: boolean;
        debugMode: boolean;
        latestLog: string;
    };
}