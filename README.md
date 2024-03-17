# 📊 Financial Tracking Application

This application offers robust tools for managing and analyzing financial records, helping users to better understand and forecast their financial activities.

## 🚀 Installation

To set up the financial tracking application on your local machine or server, follow these steps:

### Prerequisites

Ensure you have the following installed:

- Node.js (recommended: the latest LTS version)
- A package manager like npm or Yarn

### Step 1: Clone the Repository

Clone the application repository to your local machine:

```bash
git https://github.com/warrenshiv/finance_tracker.git
cd finance_tracker

## 🛠 Functionalities Overview

### 📑 Get All Financial Records

Retrieves all stored financial records. If no records are found or an error occurs, it returns an appropriate error message.

### 📄 Get Specific Financial Record

Fetches a specific financial record by its ID. Ensures the provided ID exists and is valid.

### ➕ Add Financial Record

Creates and stores a new financial record using provided data. Checks for necessary field validations before adding the record.

### 🔄 Update Financial Record

Updates details for an existing record. Validates data and checks the record's existence before making updates.

### 🏷 Update Expense Category

Modifies the category for financial records matching the old category to a new one. Performs necessary validations on the categories.

### ❌ Delete Financial Record

Removes a specific record based on its ID after confirming the record's presence.

### 📊 Get Financial Records by Category

Retrieves records associated with a specific category. Validates the input category and checks for record existence.

### 📅 Get Financial Records by Date Range

Fetches records within a given date range, ensuring the range is valid and records exist within it.

### 💹 Get Financial Summary

Offers a summary of income, expenses, and net financial flow from the records, addressing any unexpected errors during calculation.

### 💸 Get Expenses Greater Than a Specified Amount

Identifies expenses exceeding a specified amount, validating the amount and ensuring records meet the criteria.

### 💰 Get Incomes Less Than a Specified Amount

Locates income records below a certain amount, confirming amount validity and record presence.

### 📉 Get Average Monthly Expenses

Calculates average monthly expenses from historical data, ensuring expense records are present.

### 📈 Get Average Monthly Income

Determines average monthly income, ensuring income records are available for accurate calculation.

### 📝 Get Financial Records with Notes

Selects records that include notes, verifying such records exist.

### 🗒 Get Financial Records without Notes

Finds records without notes, ensuring such records are available.

### 📤 Export Financial Data

Exports stored financial data in the requested format, currently supporting only JSON. Validates the format and handles serialization.

### 🔮 Forecast Future Expenses

Predicts future expenses based on average historical data for a specified future duration. Validates input and ensures sufficient data for forecasting.
