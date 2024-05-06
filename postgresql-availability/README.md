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
	date_range daterange,
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
* Average for conflicts is 8.911540666719278 ms
* Average for inserts is 6.369238833338022 ms

Test from the beginning of the range
* Average for conflicts is 5.866388833367576 ms
* Average for inserts is 5.912630366751303 ms

Test the end of the range
* Average for conflicts is 5.484727799954514 ms
* Average for inserts is 5.848641833321502 ms

End results:
* Average for conflicts 6.754219100013789
* Average for inserts 6.043503677803609

### "WHERE" Aggregate
1000000 rows

Test from the beginning of the range
* Average for conflicts is 6.390330200068032 ms
* Average for inserts is 3.4294311667016397 ms

Test from the beginning of the range
* Average for conflicts is 3.574126633334284 ms
* Average for inserts is 3.433963466621935 ms

Test the end of the range
* Average for conflicts is 3.264059433247894 ms
* Average for inserts is 3.385712166673814 ms

End results:
* Average for conflicts 4.4095054222167365
* Average for inserts 3.4163689333324627

### "GIST" Aggregate
1000000 rows

Test from the beginning of the range
* Average for conflicts is 4.049273299953589 ms
* Average for inserts is 2.3283572999450066 ms

Test from the beginning of the range
* Average for conflicts is 2.1195229666928452 ms
* Average for inserts is 2.5530193999099233 ms

Test the end of the range
* Average for conflicts is 2.376330466599514 ms
* Average for inserts is 2.460807333420962 ms

End results:
* Average for conflicts 2.8483755777486497
* Average for inserts 2.4473946777586306