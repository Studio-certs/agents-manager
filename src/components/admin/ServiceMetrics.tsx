import React from 'react';
import { Grid, Column, Tile, Tag } from '@carbon/react';
import { formatDate } from '../../utils/formatters';

interface ServiceMetricsProps {
  service: {
    total_transactions: number;
    total_tokens: number;
    total_cost: number;
    total_runtime_ms: number;
    completed_count: number;
    failed_count: number;
    llm_count: number;
    embedding_count: number;
    storage_count: number;
    processing_count: number;
    last_used_at: string | null;
  };
}

const ServiceMetrics: React.FC<ServiceMetricsProps> = ({ service }) => {
  return (
    <Grid fullWidth>
      <Column lg={4} md={4} sm={4}>
        <Tile className="h-full p-4">
          <h3 className="text-lg font-semibold mb-2">Usage</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Transactions</span>
              <Tag type="blue">{service.total_transactions}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Tokens</span>
              <Tag type="purple">{service.total_tokens.toLocaleString()}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Cost</span>
              <Tag type="green">${service.total_cost.toFixed(2)}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Runtime</span>
              <Tag type="warm-gray">{(service.total_runtime_ms / 1000).toFixed(2)}s</Tag>
            </div>
          </div>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <Tile className="h-full p-4">
          <h3 className="text-lg font-semibold mb-2">Status Distribution</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Completed</span>
              <Tag type="green">{service.completed_count}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Failed</span>
              <Tag type="red">{service.failed_count}</Tag>
            </div>
          </div>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <Tile className="h-full p-4">
          <h3 className="text-lg font-semibold mb-2">Resource Types</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>LLM</span>
              <Tag type="blue">{service.llm_count}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Embedding</span>
              <Tag type="purple">{service.embedding_count}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Storage</span>
              <Tag type="cyan">{service.storage_count}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Processing</span>
              <Tag type="gray">{service.processing_count}</Tag>
            </div>
          </div>
        </Tile>
      </Column>

      {service.last_used_at && (
        <Column lg={12} md={8} sm={4}>
          <div className="mt-4 text-sm text-gray-600">
            Last used: {formatDate(service.last_used_at)}
          </div>
        </Column>
      )}
    </Grid>
  );
};

export default ServiceMetrics;