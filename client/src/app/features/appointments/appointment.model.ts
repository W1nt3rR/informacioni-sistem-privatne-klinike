export interface AppointmentListItem {
  appointmentId: number;
  patientId: number;
  pacijentIme: string;
  doctorId: number;
  lekarIme: string;
  serviceId: number;
  uslugaNaziv: string;
  officeId: number;
  ordinacijaNaziv: string;
  datumVreme: string;
  trajanjeMinuta: number;
  status: string;
}

export interface AppointmentDetail extends AppointmentListItem {
  razlogPromene: string | null;
  razlogOtkazivanja: string | null;
  kreatorIme: string;
  datumKreiranja: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  serviceId: number;
  officeId: number;
  datumVreme: string;
}

export interface RescheduleRequest {
  datumVreme: string;
  officeId: number | null;
  razlogPromene: string | null;
}

export interface CancelRequest {
  status: string;
  razlogOtkazivanja: string | null;
}

export interface CalendarAppointment {
  appointmentId: number;
  pacijentIme: string;
  lekarIme: string;
  uslugaNaziv: string;
  ordinacijaNaziv: string;
  datumVreme: string;
  trajanjeMinuta: number;
  status: string;
}

export interface AvailableSlot {
  vremeOd: string;
  vremeDo: string;
}

export interface Doctor {
  doctorId: number;
  ime: string;
  prezime: string;
  specijalizacijaNaziv: string;
  aktivan: boolean;
}

export interface Office {
  officeId: number;
  naziv: string;
  dostupna: boolean;
}

export interface ServiceItem {
  serviceId: number;
  naziv: string;
  trajanjeMinuta: number;
  cena: number;
  aktivan: boolean;
}
