import React from 'react';
import {
  Accordion,
  AccordionItem,
  Loading,
  Tag,
  Button,
} from '@carbon/react';
import { Edit, TrashCan } from '@carbon/icons-react';
import { useServiceStore } from '../../store/serviceStore';
import { formatDate } from '../../utils/formatters';
import ServiceMetrics from './ServiceMetrics';

interface ServiceListProps {
  onEdit: (service: any) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ onEdit }) => {
  const { services, loading, fetchServices, deleteService } = useServiceStore();
  const [expandedServices, setExpandedServices] = React.useState<Set<string>>(new Set());
  
  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const toggleServiceExpansion = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
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
              <ServiceMetrics service={service} />
            </div>
          </div>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default ServiceList;