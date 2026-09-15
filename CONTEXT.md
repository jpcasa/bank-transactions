# Bank Transactions

Stores bank transactions imported from a CSV and exposes them through a documented CRUD API and a web UI.

## Language

**Transaction**:
A single money movement on an account, recorded as one row of the source CSV: date, description, signed amount, currency, and account.
_Avoid_: Entry, record, payment

**Transaction ID**:
The one identifier of a transaction, formatted `TXN-<number>` (e.g. `TXN-1001`). Imported from the CSV or assigned by the system on creation; never changes.
_Avoid_: id, uuid, reference

**Amount**:
The signed value of a transaction — negative for money out, positive for money in. No separate debit/credit field.
_Avoid_: Value, total, balance
