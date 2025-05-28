/*
  # Add service metrics columns and trigger

  1. New Columns
    - Added to services table:
      - total_transactions (integer)
      - total_tokens (integer)
      - total_cost (numeric)
      - total_runtime_ms (bigint)
      - completed_count (integer)
      - failed_count (integer)
      - llm_count (integer)
      - embedding_count (integer)
      - storage_count (integer)
      - processing_count (integer)
      - last_used_at (timestamptz)

  2. Trigger
    - Creates trigger to update metrics when transactions are completed
    - Updates all metric columns in services table
    - Handles both insert and update cases
*/

-- Add metrics columns to services table
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
ALTER TABLE services ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

-- Create function to update service metrics
CREATE OR REPLACE FUNCTION update_service_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process completed or failed transactions
  IF (TG_OP = 'INSERT' AND NEW.status IN ('completed', 'failed'))
     OR (TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed'))
  THEN
    -- Update service metrics
    UPDATE services
    SET 
      total_transactions = total_transactions + 1,
      total_tokens = total_tokens + COALESCE(NEW.tokens_total, 0),
      total_cost = total_cost + COALESCE(NEW.resources_used_cost, 0),
      total_runtime_ms = total_runtime_ms + COALESCE(NEW.runtime_ms, 0),
      completed_count = CASE WHEN NEW.status = 'completed' 
                         THEN completed_count + 1 
                         ELSE completed_count 
                       END,
      failed_count = CASE WHEN NEW.status = 'failed' 
                      THEN failed_count + 1 
                      ELSE failed_count 
                    END,
      llm_count = CASE WHEN NEW.resource_type = 'llm' 
                    THEN llm_count + 1 
                    ELSE llm_count 
                  END,
      embedding_count = CASE WHEN NEW.resource_type = 'embedding' 
                         THEN embedding_count + 1 
                         ELSE embedding_count 
                       END,
      storage_count = CASE WHEN NEW.resource_type = 'storage' 
                       THEN storage_count + 1 
                       ELSE storage_count 
                     END,
      processing_count = CASE WHEN NEW.resource_type = 'processing' 
                          THEN processing_count + 1 
                          ELSE processing_count 
                        END,
      last_used_at = NEW.created_at
    WHERE id = NEW.service_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_service_metrics_trigger ON transactions;
CREATE TRIGGER update_service_metrics_trigger
  AFTER INSERT OR UPDATE OF status
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_service_metrics();