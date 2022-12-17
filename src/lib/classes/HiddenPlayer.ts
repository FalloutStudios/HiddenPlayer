import { Bot as MineflayerBot, BotOptions, createBot } from 'mineflayer';
import { ClientOptions } from 'minecraft-protocol';
import { Awaitable, If, isNumber } from 'fallout-utility';
import { setTimeout } from 'timers/promises';
import { TypedEmitter } from 'tiny-typed-emitter';

export interface HiddenPlayerOptions extends ClientOptions, Omit<Partial<BotOptions>, 'username'> {
    reconnectTimeout?: number;
}

export interface HiddenPlayerEvents {
    reconnect: () => Awaitable<void>;
    ready: (bot: HiddenPlayer<true>) => Awaitable<void>;
}

export class HiddenPlayer<Ready extends boolean = boolean> extends TypedEmitter<HiddenPlayerEvents> {
    private _bot: MineflayerBot|null = null;

    readonly options: HiddenPlayerOptions;

    get bot() { return this._bot as If<Ready, MineflayerBot> }

    constructor(options: HiddenPlayerOptions) {
        super();
        this.options = options;
    }

    public async login(): Promise<HiddenPlayer<true>> {
        this._bot = createBot(this.options);

        this._handleReconnect();
        this.emit('ready', this as HiddenPlayer<true>);

        return this as HiddenPlayer<true>;
    }

    public async destroy(reason?: string): Promise<HiddenPlayer<boolean>> {
        if (!this.isReady()) throw new Error(`Cannot destroy unready bot.`);

        this._bot?.end(reason);
        this._bot = null;

        return this as HiddenPlayer<boolean>;
    }

    public isReady(): this is HiddenPlayer<true> {
        return this._bot !== null;
    }

    private _handleReconnect(): void {
        if (!this.isReady()) throw new Error(`Couldn't handle reconnect for unready bot.`);
        if (!isNumber(this.options.reconnectTimeout)) return;

        this.bot.once('end', async reason => {
            await setTimeout(this.options.reconnectTimeout);

            this.emit('reconnect');
            this.login();
        });

        this.bot.once('kicked', () => this.bot?.end());
        this.bot.once('error', () => this.bot?.end());
    }
}