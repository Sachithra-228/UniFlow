-- Add booking_id column if it doesn't exist, and add FK constraint only if missing
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS booking_id BIGINT;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_tickets_booking'
	) THEN
		ALTER TABLE tickets
		ADD CONSTRAINT fk_tickets_booking
		FOREIGN KEY (booking_id) REFERENCES bookings(id)
		ON DELETE SET NULL;
	END IF;
END $$;
