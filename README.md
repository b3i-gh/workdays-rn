# Workdays Tracker

A mobile application for freelancers to track working days, expenses, and taxes under the Italian "Regime Forfettario" tax system.

## Key Features

### 📅 Working Days Management

- Interactive calendar to mark worked days
- Monthly view with real-time statistics
- Automatic gross income calculation based on a fixed daily rate

### 💰 Tax Calculations (Italian Forfettario)

- Automatic taxable income calculation (78% of revenue)
- Substitute tax calculation (5%)
- INPS contributions calculation (26.07%)
- Estimated net income display

### 💸 Expense Management

- Record expenses with date, description, and amount
- Automatic categorization of past and future expenses
- Expense coverage indicator based on projected revenue
- Warnings when projected expenses exceed available revenue

### 📊 Reports and Statistics

- Detailed yearly overview
- Monthly statistics with worked days and amounts
- Progressive totals of revenue, taxes, and net income
- Past and future expense monitoring

### 📤 Backup and Export

- Complete backup export in JSON format
- Data restoration from JSON backup

## Technical Details

### Tax Calculations

- Revenue coefficient: 78%
- Substitute tax rate: 5%
- INPS contribution rate: 26.07%

### Technology Stack

- React Native with Expo Router
- TypeScript for type safety
- AsyncStorage for data persistence
- Context API for global state management

## Getting Started

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Start the application:

   ```powershell
   npx expo start
   ```

3. Use Expo Go on your device or an emulator to test the application

## Daily Usage

1. **Recording Working Days**

   - Open the "Month Recap" tab
   - Tap days in the calendar to mark them as worked
   - View monthly tax calculations instantly

2. **Managing Expenses**

   - Go to the "Expenses Coverage" tab
   - Use the "Add Expense" button to record new expenses
   - Monitor future expense coverage

3. **Yearly Analysis**

   - Use the "Year Recap" tab to see the annual summary
   - Check progressive totals and monthly statistics

4. **Data Backup**
   - Go to "Settings"
   - Use "Export Backup" to save data in JSON format
   - Use "Restore from Backup" to restore data

## Changelog 

### v1.1.0

- modified the backup file name to workdays-backup-
- improved the format of income and tax values in the year recap
- in the year recap the paid months (more than 60 day passed) are marked
- renamed the expense coverage tab and all the labels to represent savings
- savings can be inserted with decimal values
- tax savings are now managed separately from the other savings
- savings now manages many types (long term, short term, etc) and have different target based con the total income

## Future implementations

- v2.0.0 manage taxes payments
