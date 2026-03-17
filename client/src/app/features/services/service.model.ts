export interface ServiceItem {
  serviceId: number;
  naziv: string;
  opis: string | null;
  trajanjeMinuta: number;
  cena: number;
  specializationId: number;
  specijalizacijaNaziv: string;
  aktivan: boolean;
}
