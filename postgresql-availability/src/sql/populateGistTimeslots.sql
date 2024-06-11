CREATE OR REPLACE FUNCTION populate_gist_time_slots()
RETURNS void AS $$
DECLARE
  from_date DATE;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  i INT;
  j INT;
BEGIN
  from_date := '2024-05-01';  -- Replace with your actual start date

  FOR i IN 0..99 LOOP -- 100 ranges for every resource
    -- Calculate the date by adding i*30 days to from_date
    from_date := from_date + (i * 30);

    FOR j IN 0..9999 LOOP  -- Loop through each resourceId
      start_time := from_date;
      end_time := from_date + interval '30 hours';

      -- Insert the record into the TimeSlot table
      INSERT INTO "timeslot3" ("requesterid", "resourceid", "date_range")
      VALUES ('artur', j, tsrange(start_time, end_time, '[)'));
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT populate_gist_time_slots();