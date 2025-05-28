import React from 'react';
import { Grid, Column, Tile, Tag, Loading } from '@carbon/react';
import { formatDate } from '../../utils/formatters';

interface ServiceMetricsProps {
  serviceId: string;
  metrics: {
    total_transactions: number;
    total_tokens: number;
    total_cost: number;
    total_runtime: number;
    status_counts: {
      completed: number;
      failed: number;
      running: number;
      pending: number;
    };
    resource_type_counts: {
      llm: number;
      embedding: number;
      storage: number;
      processing: number;
    };
    last_used: string | null;
  } | null;
  loading: boolean;
}

const ServiceMetrics: React.FC<ServiceMetricsProps> = ({ metrics, loading }) => {
  if (loading) {
    return <Loading description="Loading metrics..." />;
  }

  if (!metrics) {
    return (
      <div className="text-center p-4">
        <p>No metrics available</p>
      </div>
    );
  }

  return (
    <Grid fullWidth>
      <Column lg={4} md={4} sm={4}>
        <Tile className="h-full p-4">
          <h3 className="text-lg font-semibold mb-2">Usage</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Transactions</span>
              <Tag type="blue">{metrics.total_transactions}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Tokens</span>
              <Tag type="purple">{metrics.total_tokens.toLocaleString()}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Cost</span>
              <Tag type="green">${metrics.total_cost.toFixed(2)}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Runtime</span>
              <Tag type="warm-gray">{(metrics.total_runtime / 1000).toFixed(2)}s</Tag>
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
              <Tag type="green">{metrics.status_counts.completed}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Failed</span>
              <Tag type="red">{metrics.status_counts.failed}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Running</span>
              <Tag type="blue">{metrics.status_counts.running}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Pending</span>
              <Tag type="purple">{metrics.status_counts.pending}</Tag>
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
              <Tag type="blue">{metrics.resource_type_counts.llm}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Embedding</span>
              <Tag type="purple">{metrics.resource_type_counts.embedding}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Storage</span>
              <Tag type="cyan">{metrics.resource_type_counts.storage}</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Processing</span>
              <Tag type="gray">{metrics.resource_type_counts.processing}</Tag>
            </div>
          </div>
        </Tile>
      </Column>

      {metrics.last_used && (
        <Column lg={12} md={8} sm={4}>
          <div className="mt-4 text-sm text-gray-600">
            Last used: {formatDate(metrics.last_used)}
          </div>
        </Column>
      )}
    </Grid>
  );
};

export default ServiceMetrics;