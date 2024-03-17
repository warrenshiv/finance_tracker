import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type FinancialRecord = Record<{
    id: string;
    amount: number;
    category: string;
    notes: Opt<string>;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

type FinancialRecordPayload = Record<{
    amount: number;
    category: string;
    notes: Opt<string>;
}>;


const financialRecordStorage = new StableBTreeMap<string, FinancialRecord>(0, 44, 1024);

$query;
export function getFinancialRecords(): Result<Vec<FinancialRecord>, string> {
    try {
        const records = financialRecordStorage.values();
        if (records.length === 0) {
            // If considering an empty record set as an error situation
            return Result.Err('No financial records found.');
        }
        return Result.Ok(records);
    } catch (error) {
        // In case there's a need to catch and handle any unexpected error
        return Result.Err('An unexpected error occurred while retrieving financial records.');
    }
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
    // Validate the payload
    if (!payload.amount || !payload.category ) {
        return Result.Err<FinancialRecord, string>('amount and category are required');
    }

    const record: FinancialRecord = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    financialRecordStorage.insert(record.id, record);
    return Result.Ok(record);
}

$update;
export function updateFinancialRecord(id: string, payload: FinancialRecordPayload): Result<FinancialRecord, string> {
    // Validate the payload
    if (!payload.amount || !payload.category ) {
        return Result.Err<FinancialRecord, string>('amount and category are required');
    }

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
    // Validate the id
    if (!id) {
        return Result.Err<FinancialRecord, string>('id is required');
    }

    return match(financialRecordStorage.remove(id), {
        Some: (deletedRecord) => Result.Ok<FinancialRecord, string>(deletedRecord),
        None: () => Result.Err<FinancialRecord, string>(`couldn't delete a financial record with id=${id}. record not found.`)
    });
}

$query;
export function getFinancialRecordsByCategory(category: string): Result<Vec<FinancialRecord>, string> {
    // Validate the category
    if (!category) {
        return Result.Err<Vec<FinancialRecord>, string>('category is required');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.category === category);
    return Result.Ok(filteredRecords);
}

$query;
export function getFinancialRecordsByDateRange(startDate: nat64, endDate: nat64): Result<Vec<FinancialRecord>, string> {
    // Validate the date range
    if (!startDate || !endDate) {
        return Result.Err<Vec<FinancialRecord>, string>('startDate and endDate are required');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.createdAt >= startDate && record.createdAt <= endDate);
    return Result.Ok(filteredRecords);
}

$query;
export function getFinancialSummary(): Result<Record<{ totalIncome: number; totalExpense: number; netFlow: number; }>, string> {
    let totalIncome = 0;
    let totalExpense = 0;
    financialRecordStorage.values().forEach(record => {
        if (record.amount > 0) {
            totalIncome += record.amount;
        } else {
            totalExpense += record.amount;
        }
    });
    return Result.Ok({ totalIncome, totalExpense, netFlow: totalIncome + totalExpense });
}

$query;
export function getExpensesGreaterThan(amount: number): Result<Vec<FinancialRecord>, string> {
    // Validate the amount
    if (!amount) {
        return Result.Err<Vec<FinancialRecord>, string>('amount is required');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.amount < 0 && Math.abs(record.amount) > amount);
    return Result.Ok(filteredRecords);
}


$query;
export function getIncomesLessThan(amount: number): Result<Vec<FinancialRecord>, string> {
    // Validate the amount
    if (!amount) {
        return Result.Err<Vec<FinancialRecord>, string>('amount is required');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.amount > 0 && record.amount < amount);
    return Result.Ok(filteredRecords);
}

$query;
export function getAverageMonthlyExpenses(): Result<number, string> {
    const expenses = financialRecordStorage.values().filter(record => record.amount < 0);
    const totalExpenses = expenses.reduce((sum, record) => sum + Math.abs(record.amount), 0);
    return Result.Ok(totalExpenses / 12);
}

$query;
export function getAverageMonthlyIncome(): Result<number, string> {
    const incomes = financialRecordStorage.values().filter(record => record.amount > 0);
    const totalIncome = incomes.reduce((sum, record) => sum + record.amount, 0);
    return Result.Ok(totalIncome / 12);
}

$query;
export function getFinancialRecordsWithNotes(): Result<Vec<FinancialRecord>, string> {
    const filteredRecords = financialRecordStorage.values().filter(record => record.notes !== null);
    return Result.Ok(filteredRecords);
}

$query;
export function getFinancialRecordsWithoutNotes(): Result<Vec<FinancialRecord>, string> {
    const filteredRecords = financialRecordStorage.values().filter(record => record.notes === null);
    return Result.Ok(filteredRecords);
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