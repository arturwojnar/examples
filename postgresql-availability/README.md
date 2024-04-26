## Data description

* 999 resources
* every resource has 100 reservations
* every reservation lasts 125 hours (over 5 days)
* every reservation is distanced 10 days from each other

## Tested on

* 13th Gen Intel(R) Core(TM) i9-13900H   2.60 GHz
* 32,0 GB
* SSD M.2 PCIe

## "15-min TimeSlots" Aggregate
49 950 000 rows 

* Average for conflicts is 5.806657666712999 ms
* Average for inserts is 6.98430580124259 ms

## "WHERE" Aggregate
99900 rows

* Average for conflicts is 4.758546566590667 ms
* Average for inserts is 9.028693666433295 ms

## "GIST" Aggregate
99900 rows

* Average for conflicts is 2.9231600001454354 ms
* Average for inserts is 2.447195566818118 ms

```sql
CREATE TABLE TimeSlot3(
	id SERIAL PRIMARY KEY,
	requesterId text,
	resourceId  integer,
	date_range daterange,
	EXCLUDE USING GIST (resourceId WITH =, date_range WITH &&)
);
```