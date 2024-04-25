## "TimeSlots" Aggregate

Average for conflicts is 5.806657666712999 ms
Average for inserts is 6.98430580124259 ms

## "WHERE" Aggregate
Average for conflicts is 4.758546566590667 ms
Average for inserts is 9.028693666433295 ms

## "GIST" Aggregate
```psql
CREATE TABLE TimeSlot3(
	id SERIAL PRIMARY KEY,
	requesterId text,
	resourceId  integer,
	date_range daterange,
	EXCLUDE USING GIST (date_range WITH &&)
);
```