import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Stats {
    totalLosses: number;
    lossCount: bigint;
    consecutiveLosses: bigint;
    totalWins: number;
    winCount: bigint;
    netPL: number;
}
export interface Trade {
    id: string;
    tradeType: string;
    owner: Principal;
    date: string;
    note: string;
    timestamp: bigint;
    amount: number;
}
export interface backendInterface {
    addTrade(amount: number, note: string, tradeType: string, date: string): Promise<string>;
    deleteTrade(id: string): Promise<void>;
    getStats(): Promise<Stats>;
    getTrades(): Promise<Array<Trade>>;
    getTradesByDateRange(startDate: string, endDate: string): Promise<Array<Trade>>;
}
