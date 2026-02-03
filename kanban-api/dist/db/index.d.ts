import Knex from 'knex';
export declare const knex: Knex.Knex<any, unknown[]>;
export declare const initializeDb: () => Promise<void>;
export declare const closeDb: () => Promise<void>;
