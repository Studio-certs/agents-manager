/*
  # Add service metrics and cleanup functionality

  1. New Columns
    - Add metric columns to services table for aggregated statistics
    - Add last_cleanup_at to track when transactions were last cleaned

  2. Functions
    - Create function to aggregate service metrics
    - Create function to clean old transactions
    - Create trigger to update metrics on transaction changes

  3. Security
    - Add RLS policies for admin access
*/

-- Add metric columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS total_transactions integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS total_tokens integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS total_cost numeric(10,2) DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS total_runtime_ms bigint DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS completed_count integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS failed_count integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS llm_count integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS embedding_count integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS storage_count integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS processing_count integer DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone;
ALTER TABLE services ADD COLUMN IF NOT EXISTS last_cleanup_at timestamp with time zone;

-- Function to update service metrics
CREATE OR REPLACE FUNCTION update_service_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE services
    SET 
      total_transactions = total_transactions + 1,
      total_tokens = total_tokens + COALESCE(NEW.tokens_total, 0),
      total_cost = total_cost + COALESCE(NEW.resources_used_cost, 0),
      total_runtime_ms = total_runtime_ms + COALESCE(NEW.runtime_ms, 0),
      completed_count = completed_count + 1,
      last_used_at = NOW(),
      llm_count = CASE WHEN NEW.resource_type = 'llm' THEN llm_count + 1 ELSE llm_count END,
      embedding_count = CASE WHEN NEW.resource_type = 'embedding' THEN embedding_count + 1 ELSE embedding_count END,
      storage_count = CASE WHEN NEW.resource_type = 'storage' THEN storage_count + 1 ELSE storage_count END,
      processing_count = CASE WHEN NEW.resource_type = 'processing' THEN processing_count + 1 ELSE processing_count END
    WHERE id = NEW.service_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE services
    SET 
      failed_count = failed_count + 1,
      last_used_at = NOW()
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metric updates
DROP TRIGGER IF EXISTS update_service_metrics_trigger ON transactions;
CREATE TRIGGER update_service_metrics_trigger
  AFTER INSERT OR UPDATE OF status
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_service_metrics();

-- Function to clean old transactions
CREATE OR REPLACE FUNCTION clean_old_transactions(days_to_keep integer)
RETURNS void AS $$
BEGIN
  -- Archive completed transactions older than specified days
  INSERT INTO transaction_archive
  SELECT *
  FROM transactions
  WHERE 
    status IN ('completed', 'failed')
    AND created_at < NOW() - (days_to_keep || ' days')::interval;

  -- Delete archived transactions
  DELETE FROM transactions
  WHERE 
    status IN ('completed', 'failed')
    AND created_at < NOW() - (days_to_keep || ' days')::interval;

  -- Update last_cleanup_at for affected services
  UPDATE services
  SET last_cleanup_at = NOW()
  WHERE id IN (
    SELECT DISTINCT service_id
    FROM transaction_archive
    WHERE created_at >= COALESCE(last_cleanup_at, '1970-01-01'::timestamp)
  );
END;
$$ LANGUAGE plpgsql;

-- Create transaction archive table
CREATE TABLE IF NOT EXISTS transaction_archive (
  LIKE transactions INCLUDING ALL
);

-- Add RLS policies for admin access to archive
ALTER TABLE transaction_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read transaction archive"
  ON transaction_archive
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION clean_old_transactions(integer) TO authenticated;