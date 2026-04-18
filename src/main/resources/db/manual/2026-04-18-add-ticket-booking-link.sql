ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS booking_id BIGINT;

ALTER TABLE tickets
ADD CONSTRAINT fk_tickets_booking
FOREIGN KEY (booking_id) REFERENCES bookings(id)
ON DELETE SET NULL;
