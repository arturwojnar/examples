# Tests

## 100 000 reservations

* 999 resources
* every resource has 100 reservations
* every reservation lasts 125 hours (over 5 days)
* every reservation is distanced i*10 days from each other

### Tested on

* 13th Gen Intel(R) Core(TM) i9-13900H   2.60 GHz
* 32,0 GB
* SSD M.2 PCIe

### "15-min TimeSlots" Aggregate
49 950 000 rows 

* Average for conflicts is 5.806657666712999 ms
* Average for inserts is 6.98430580124259 ms

### "WHERE" Aggregate
99900 rows

* Average for conflicts is 4.758546566590667 ms
* Average for inserts is 9.028693666433295 ms

### "GIST" Aggregate
99900 rows

* Average for conflicts is 2.9231600001454354 ms
* Average for inserts is 2.447195566818118 ms

```sql
CREATE TABLE TimeSlot3(
	id SERIAL PRIMARY KEY,
	requesterId text,
	resourceId  integer,
	date_range tsrange,
	locked boolean,
	EXCLUDE USING GIST (resourceId WITH =, date_range WITH &&)
);
```

## 1 000 000 reservations

* 1000 resources
* every resource has 1000 reservations
* every reservation lasts 30 hours
* every reservation is distanced i*30 days from each other
* MEASUREMENTS TAKEN FROM THE BEGINNING OF THE RANGE, FROM THE MIDDLE AND FROM THE END

### "15-min TimeSlots" Aggregate
120 000 000 rows

Test from the beginning of the range

* Average for conflicts is 5.108751233294607 ms
* Average for inserts is 6.4359818000656865 ms

Test from the middle of the range
* Average for conflicts is 2.173837499941389 ms
* Average for inserts is 6.095734866677473 ms

Test the end of the range
* Average for conflicts is 2.3753029664978387 ms
* Average for inserts is 6.594922833393017 ms

Total:
* Average for conflicts 3.2192972332446117
* Average for inserts 6.375546500045393

Unlocking/Reclocking:
* Average for unlocking is 4.706522999983281 ms
* Average for relocking is 5.857777599990368 ms

### "WHERE" Aggregate
1000000 rows

Test from the beginning of the range
* Average for conflicts is 5.128713533344368 ms
* Average for inserts is 3.4463379666519662 ms

Test from the beginning of the range
* Average for conflicts is 2.2198472000154044 ms
* Average for inserts is 3.7784811333442727 ms

Test the end of the range
* Average for conflicts is 2.3457417333343376 ms
* Average for inserts is 3.2697424333387364 ms

Total:
* Average for conflicts 3.231434155564703
* Average for inserts 3.498187177778325

Unlocking/Reclocking:
* Average for unlocking is 2.8717502666676107 ms
* Average for relocking is 3.1760894333400453 ms

### "GIST" Aggregate
1000000 rows

Test from the beginning of the range
* Average for conflicts is 2.5197022000017264 ms
* Average for inserts is 2.096867100040739 ms

Test from the middle of the range
* Average for conflicts is 0.8248383999957393 ms
* Average for inserts is 2.164987766649574 ms

Test the end of the range
* Average for conflicts is 1.0798298999822389 ms
* Average for inserts is 2.2244044999436787 ms

End results:
* Average for conflicts 1.4747901666599015
* Average for inserts 2.1620864555446637

Unlocking/Reclocking:
* Average for unlocking is 2.23990056666856 ms
* Average for relocking is 2.0603567000012846 ms