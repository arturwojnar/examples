-- Create a function to populate the data
/*

*/
CREATE OR REPLACE FUNCTION populate_time_slots()
RETURNS void AS $$
DECLARE
  from_date DATE;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  i INT;
  j INT;
  k INT;
BEGIN
  from_date := '2024-05-01';  -- Replace with your actual start date

  FOR i IN 0..99 LOOP -- 100 ranges for every resource
    -- Calculate the date by adding i*30 days to from_date
    from_date := from_date + (i * 30);

    FOR j IN 0..9999 LOOP  -- Loop through each resourceId
      FOR k IN 0..119 LOOP  -- Generate 120 slots for each resource each day
        start_time := from_date + (k * interval '15 minutes');
        end_time := start_time + interval '15 minutes';

        -- Insert the record into the TimeSlot table
        INSERT INTO TimeSlot (requesterId, resourceId, startTime, endTime)
        VALUES ('artur', j, start_time, end_time);
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT populate_time_slots();