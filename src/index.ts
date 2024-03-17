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
            return Result.Err('No financial records found.');
        }
        return Result.Ok(records);
    } catch (error) {
        return Result.Err('An unexpected error occurred while retrieving financial records.');
    }
}

$query;
export function getFinancialRecord(id: string): Result<FinancialRecord, string> {
    // Validate the id
    if (!id) {
        return Result.Err<FinancialRecord, string>('id is required');
    }

    return match(financialRecordStorage.get(id), {
        Some: (record) => Result.Ok<FinancialRecord, string>(record),
        None: () => Result.Err<FinancialRecord, string>(`couldn't find a financial record with id=${id}`)
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
export function updateExpenseCategory(oldCategory: string, newCategory: string): Result<Vec<FinancialRecord>, string> {
    // Validate the old and new categories
    if (!oldCategory || !newCategory) {
        return Result.Err('oldCategory and newCategory are required.');
    }

    const records = financialRecordStorage.values().filter(record => record.category === oldCategory);

    // Check if any records were found for the old category
    if (records.length === 0) {
        return Result.Err(`No financial records found for category: ${oldCategory}.`);
    }

    records.forEach(record => {
        record.category = newCategory;
        financialRecordStorage.insert(record.id, record);
    });

    return Result.Ok(records);
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
        return Result.Err('Category is required.');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.category === category);

    // Check if any records were found for the given category
    if (filteredRecords.length === 0) {
        return Result.Err(`No financial records found for category: ${category}.`);
    }

    return Result.Ok(filteredRecords);
}


$query;
export function getFinancialRecordsByDateRange(startDate: nat64, endDate: nat64): Result<Vec<FinancialRecord>, string> {
    // Validate the date range inputs
    if (!startDate || !endDate) {
        return Result.Err('startDate and endDate are required.');
    }

    if (startDate > endDate) {
        return Result.Err('startDate must not be later than endDate.');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.createdAt >= startDate && record.createdAt <= endDate);

    // Check if any records were found within the date range
    if (filteredRecords.length === 0) {
        return Result.Err('No financial records found within the specified date range.');
    }

    return Result.Ok(filteredRecords);
}


$query;
export function getFinancialSummary(): Result<Record<{ totalIncome: number; totalExpense: number; netFlow: number; }>, string> {
    try {
        let totalIncome = 0;
        let totalExpense = 0;

        financialRecordStorage.values().forEach(record => {
            if (record.amount > 0) {
                totalIncome += record.amount;
            } else {
                totalExpense += record.amount;
            }
        });

        // Assuming an error should be returned if there are no financial records to summarize
        if (totalIncome === 0 && totalExpense === 0) {
            return Result.Err('No financial records available to summarize.');
        }

        return Result.Ok({ totalIncome, totalExpense, netFlow: totalIncome + totalExpense });
    } catch (error) {
        return Result.Err('An unexpected error occurred while calculating the financial summary.');
    }
}


$query;
export function getExpensesGreaterThan(amount: number): Result<Vec<FinancialRecord>, string> {
    // Validate the amount
    if (!amount || amount <= 0) {
        return Result.Err('Amount must be a positive number.');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.amount < 0 && Math.abs(record.amount) > amount);

    // Check if any records were found that match the criteria
    if (filteredRecords.length === 0) {
        return Result.Err('No expenses found greater than the specified amount.');
    }

    return Result.Ok(filteredRecords);
}


$query;
export function getIncomesLessThan(amount: number): Result<Vec<FinancialRecord>, string> {
    // Validate the amount
    if (!amount || amount <= 0) {
        return Result.Err('Amount must be a positive number.');
    }

    const filteredRecords = financialRecordStorage.values().filter(record => record.amount > 0 && record.amount < amount);

    // Check if any records were found that meet the criteria
    if (filteredRecords.length === 0) {
        return Result.Err('No incomes found less than the specified amount.');
    }

    return Result.Ok(filteredRecords);
}


$query;
export function getAverageMonthlyExpenses(): Result<number, string> {
    const expenses = financialRecordStorage.values().filter(record => record.amount < 0);

    // Check if there are no expense records
    if (expenses.length === 0) {
        return Result.Err('No expense records found.');
    }

    const totalExpenses = expenses.reduce((sum, record) => sum + Math.abs(record.amount), 0);
    
    let earliestExpenseDate = new Date(Math.min(...expenses.map(e => Number(e.createdAt))));
    let latestExpenseDate = new Date(Math.max(...expenses.map(e => Number(e.createdAt))));
    let monthDiff = (latestExpenseDate.getFullYear() - earliestExpenseDate.getFullYear()) * 12 + (latestExpenseDate.getMonth() - earliestExpenseDate.getMonth() + 1);

    // Prevent division by zero and adjust if there's only one month of data
    let averageMonthlyExpenses = monthDiff > 0 ? totalExpenses / monthDiff : totalExpenses;

    return Result.Ok(averageMonthlyExpenses);
}

$query;
export function getAverageMonthlyIncome(): Result<number, string> {
    const incomes = financialRecordStorage.values().filter(record => record.amount > 0);

    // Check if there are no income records
    if (incomes.length === 0) {
        return Result.Err('No income records found.');
    }

    const totalIncome = incomes.reduce((sum, record) => sum + record.amount, 0);

    // Calculate the number of months across which income records exist
    let earliestIncomeDate = new Date(Math.min(...incomes.map(e => Number(e.createdAt))));
    let latestIncomeDate = new Date(Math.max(...incomes.map(e => Number(e.createdAt))));
    let monthDiff = (latestIncomeDate.getFullYear() - earliestIncomeDate.getFullYear()) * 12 + latestIncomeDate.getMonth() - earliestIncomeDate.getMonth() + 1;

    // Prevent division by zero and adjust if there's only one month of data
    let averageMonthlyIncome = monthDiff > 0 ? totalIncome / monthDiff : totalIncome;

    return Result.Ok(averageMonthlyIncome);
}

$query;
export function getFinancialRecordsWithNotes(): Result<Vec<FinancialRecord>, string> {
    // Assuming notes being an Opt<string>, you should check for Opt.none() equivalency in TypeScript context.
    const filteredRecords = financialRecordStorage.values().filter(record => record.notes && record.notes !== null);

    // Check if any records were found
    if (filteredRecords.length === 0) {
        return Result.Err('No financial records with notes found.');
    }

    return Result.Ok(filteredRecords);
}


$query;
export function getFinancialRecordsWithoutNotes(): Result<Vec<FinancialRecord>, string> {
    const filteredRecords = financialRecordStorage.values().filter(record => !record.notes || record.notes === null);

    // Check if any records were found
    if (filteredRecords.length === 0) {
        return Result.Err('No financial records without notes found.');
    }

    return Result.Ok(filteredRecords);
}

$query;
export function exportFinancialData(format: string): Result<string, string> {
    if (!format) {
        return Result.Err('Format is required.');
    }

    const normalizedFormat = format.toLowerCase();
    if (normalizedFormat !== 'json') {
        return Result.Err('Unsupported format. Currently, only JSON export is available.');
    }

    try {
        const data = financialRecordStorage.values();

        if (data.length === 0) {
            return Result.Err('No financial data available to export.');
        }

        // Custom replacer function to handle bigint serialization
        const replacer = (key: string, value: any) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        };

        const jsonData = JSON.stringify(data, replacer);

        if (!jsonData) {
            return Result.Err('Failed to serialize financial data.');
        }

        return Result.Ok(jsonData);
    } catch (error) {
        if (error instanceof Error) {
            return Result.Err(`An error occurred during export: ${error.message}`);
        } else {
            return Result.Err('An unknown error occurred during export.');
        }
    }
}

$query;
export function forecastFutureExpenses(monthsAhead: number): Result<number, string> {
    if (!monthsAhead || isNaN(monthsAhead)) {
        return Result.Err('Invalid input: monthsAhead is required and must be a number.');
    }
    if (monthsAhead <= 0) {
        return Result.Err('Invalid input: monthsAhead must be greater than 0.');
    }

    const expenses = financialRecordStorage.values().filter(record => record.amount < 0);
    
    // Ensure there are enough expense records to make a meaningful forecast
    if (expenses.length === 0) {
        return Result.Err('Insufficient data: No expense records found.');
    }

    const totalExpenses = expenses.reduce((sum, record) => sum + Math.abs(record.amount), 0);
    
    // Prevent division by zero by ensuring the expenses array is not empty
    if (expenses.length === 0) {
        return Result.Err('Division by zero error: No expense records available.');
    }

    const monthlyAverage = totalExpenses / expenses.length;

    // Forecast future expenses based on the average
    return Result.Ok(monthlyAverage * monthsAhead);
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