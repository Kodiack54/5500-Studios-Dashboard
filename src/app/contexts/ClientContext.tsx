'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Client {
  id: string;
  name: string;
  slug: string;
}

interface ClientContextType {
  clients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType>({
  clients: [],
  selectedClient: null,
  setSelectedClient: () => {},
  isLoading: true,
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/project-management/api/clients');
      const data = await response.json();
      if (data.success && data.clients) {
        setClients(data.clients);
        // Auto-select first client if none selected
        if (data.clients.length > 0 && !selectedClient) {
          // Check localStorage for saved selection
          const savedClientId = localStorage.getItem('selectedClientId');
          const savedClient = data.clients.find((c: Client) => c.id === savedClientId);
          setSelectedClient(savedClient || data.clients[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSelectedClient = (client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      localStorage.setItem('selectedClientId', client.id);
    } else {
      localStorage.removeItem('selectedClientId');
    }
  };

  return (
    <ClientContext.Provider value={{
      clients,
      selectedClient,
      setSelectedClient: handleSetSelectedClient,
      isLoading,
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}

export default ClientContext;
