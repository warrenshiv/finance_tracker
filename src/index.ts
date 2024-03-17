import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type FinancialRecord = Record<{
    id: string;
    amount: number;
    category: string;
    date: nat64;
    notes: Opt<string>;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

type FinancialRecordPayload = Record<{
    amount: number;
    category: string;
    date: nat64;
    notes: Opt<string>;
}>;

const financialRecordStorage = new StableBTreeMap<string, FinancialRecord>(0, 44, 1024);

$query;
export function getFinancialRecords(): Result<Vec<FinancialRecord>, string> {
    return Result.Ok(financialRecordStorage.values());
}

$query;
export function getFinancialRecord(id: string): Result<FinancialRecord, string> {
    return match(financialRecordStorage.get(id), {
        Some: (record) => Result.Ok<FinancialRecord, string>(record),
        None: () => Result.Err<FinancialRecord, string>(`a financial record with id=${id} not found`)
    });
}

$update;
export function addFinancialRecord(payload: FinancialRecordPayload): Result<FinancialRecord, string> {
    const record: FinancialRecord = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    financialRecordStorage.insert(record.id, record);
    return Result.Ok(record);
}

$update;
export function updateFinancialRecord(id: string, payload: FinancialRecordPayload): Result<FinancialRecord, string> {
    return match(financialRecordStorage.get(id), {
        Some: (record) => {
            const updatedRecord: FinancialRecord = {...record, ...payload, updatedAt: Opt.Some(ic.time())};
            financialRecordStorage.insert(record.id, updatedRecord);
            return Result.Ok<FinancialRecord, string>(updatedRecord);
        },
        None: () => Result.Err<FinancialRecord, string>(`couldn't update a financial record with id=${id}. record not found`)
    });
}

$update;
export function deleteFinancialRecord(id: string): Result<FinancialRecord, string> {
    return match(financialRecordStorage.remove(id), {
        Some: (deletedRecord) => Result.Ok<FinancialRecord, string>(deletedRecord),
        None: () => Result.Err<FinancialRecord, string>(`couldn't delete a financial record with id=${id}. record not found.`)
    });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
   getRandomValues: () => {
       let array = new Uint8Array(32);

       for (let i = 0; i < array.length; i++) {
           array[i] = Math.floor(Math.random() * 256);
       }

       return array;
   }
};