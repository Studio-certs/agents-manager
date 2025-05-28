import React from 'react';
import {
  Accordion,
  AccordionItem,
  Loading,
  Tag,
  Button,
  Modal,
} from '@carbon/react';
import { Edit, TrashCan, Clean } from '@carbon/icons-react';
import { useServiceStore } from '../../store/serviceStore';
import { formatDate } from '../../utils/formatters';
import ServiceMetrics from './ServiceMetrics';
import { supabase } from '../../services/supabase';

interface ServiceListProps {
  onEdit: (service: any) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ onEdit }) => {
  const { services, loading, fetchServices, deleteService } = useServiceStore();
  const [expandedServices, setExpandedServices] = React.useState<Set<string>>(new Set());
  const [cleanupModalOpen, setCleanupModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<any>(null);
  const [cleanupDays, setCleanupDays] = React.useState(30);
  const [cleanupLoading, setCleanupLoading] = React.useState(false);
  
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

  const handleCleanup = async (serviceId: string) => {
    setSelectedService(services.find(s => s.id === serviceId));
    setCleanupModalOpen(true);
  };

  const executeCleanup = async () => {
    if (!selectedService) return;
    
    setCleanupLoading(true);
    try {
      const { error } = await supabase.rpc('clean_old_transactions', {
        days_to_keep: cleanupDays
      });
      
      if (error) throw error;
      
      // Refresh services to get updated metrics
      await fetchServices();
      setCleanupModalOpen(false);
    } catch (error) {
      console.error('Error cleaning up transactions:', error);
    } finally {
      setCleanupLoading(false);
    }
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
    <>
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
                    renderIcon={Clean}
                    iconDescription="Clean Transactions"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCleanup(service.id);
                    }}
                  >
                    Clean
                  </Button>
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

              {service.last_cleanup_at && (
                <div className="mt-4 text-sm text-gray-600">
                  Last cleanup: {formatDate(service.last_cleanup_at)}
                </div>
              )}
            </div>
          </AccordionItem>
        ))}
      </Accordion>

      <Modal
        open={cleanupModalOpen}
        onRequestClose={() => setCleanupModalOpen(false)}
        modalHeading={`Clean Transactions - ${selectedService?.name}`}
        primaryButtonText={cleanupLoading ? "Cleaning..." : "Clean Transactions"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={cleanupLoading}
        onRequestSubmit={executeCleanup}
      >
        <div className="p-4">
          <p className="mb-4">
            This will archive completed and failed transactions older than the specified number of days.
            Metrics will be preserved, but transaction details will be moved to an archive table.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Days to Keep</label>
            <input
              type="number"
              value={cleanupDays}
              onChange={(e) => setCleanupDays(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min="1"
              max="365"
            />
          </div>
          {selectedService?.last_cleanup_at && (
            <p className="text-sm text-gray-600">
              Last cleaned: {formatDate(selectedService.last_cleanup_at)}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ServiceList;