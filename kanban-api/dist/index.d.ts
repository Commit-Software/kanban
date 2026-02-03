import { Server as SocketIOServer } from 'socket.io';
declare const app: import("express-serve-static-core").Express;
export declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const emitTaskEvent: (event: string, data: unknown) => void;
export { app };
