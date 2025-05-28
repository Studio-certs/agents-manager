import React, { useEffect, useState } from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading,
  Tag,
  Button,
  Accordion,
  AccordionItem,
} from '@carbon/react';
import { Edit, TrashCan } from '@carbon/icons-react';
import { useServiceStore } from '../../store/serviceStore';
import { formatDate } from '../../utils/formatters';
import { supabase } from '../../services/supabase';
import ServiceMetrics from './ServiceMetrics';

interface ServiceListProps {
  onEdit: (service: any) => void;
}

interface ServiceMetrics {
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
}

const ServiceList: React.FC<ServiceListProps> = ({ onEdit }) => {
  const { services, loading, fetchServices, deleteService } = useServiceStore();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [metricsLoading, setMetricsLoading] = useState<Record<string, boolean>>({});
  const [serviceMetrics, setServiceMetrics] = useState<Record<string, ServiceMetrics>>({});
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchServiceMetrics = async (serviceId: string) => {
    setMetricsLoading(prev => ({ ...prev, [serviceId]: true }));
    try {
      // Fetch all transactions for this service
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('service_id', serviceId);

      if (error) throw error;

      // Calculate metrics
      const metrics: ServiceMetrics = {
        total_transactions: transactions.length,
        total_tokens: transactions.reduce((sum, t) => sum + (t.tokens_total || 0), 0),
        total_cost: transactions.reduce((sum, t) => sum + (t.resources_used_cost || 0), 0),
        total_runtime: transactions.reduce((sum, t) => sum + (t.runtime_ms || 0), 0),
        status_counts: {
          completed: transactions.filter(t => t.status === 'completed').length,
          failed: transactions.filter(t => t.status === 'failed').length,
          running: transactions.filter(t => t.status === 'running').length,
          pending: transactions.filter(t => t.status === 'pending').length,
        },
        resource_type_counts: {
          llm: transactions.filter(t => t.resource_type === 'llm').length,
          embedding: transactions.filter(t => t.resource_type === 'embedding').length,
          storage: transactions.filter(t => t.resource_type === 'storage').length,
          processing: transactions.filter(t => t.resource_type === 'processing').length,
        },
        last_used: transactions.length > 0 
          ? transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null,
      };

      setServiceMetrics(prev => ({ ...prev, [serviceId]: metrics }));
    } catch (error) {
      console.error('Error fetching service metrics:', error);
    } finally {
      setMetricsLoading(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const toggleServiceExpansion = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
      if (!serviceMetrics[serviceId]) {
        fetchServiceMetrics(serviceId);
      }
    }
    setExpandedServices(newExpanded);
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Tag type="cool-gray">No Services</Tag>
        <p className="mt-4">No services have been registered yet</p>
      </div>
    );
  }
  
  return (
    <Accordion>
      {services.map(service => (
        <AccordionItem
          key={service.id}
          title={
            <div className="flex items-center justify-between w-full pr-4">
              <div>
                <span className="font-semibold">{service.name}</span>
                <span className="text-sm text-gray-600 ml-4">
                  Created {formatDate(service.created_at)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={Edit}
                  iconDescription="Edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(service);
                  }}
                >
                  Edit
                </Button>
                <Button
                  kind="danger--ghost"
                  size="sm"
                  renderIcon={TrashCan}
                  iconDescription="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteService(service.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          }
          open={expandedServices.has(service.id)}
          onClick={() => toggleServiceExpansion(service.id)}
        >
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Service Details</h3>
              <p className="text-gray-600">{service.description || 'No description provided'}</p>
              <a 
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                {service.url}
              </a>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Usage Metrics</h3>
              <ServiceMetrics
                serviceId={service.id}
                metrics={serviceMetrics[service.id]}
                loading={metricsLoading[service.id]}
              />
            </div>
          </div>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default ServiceList;