export interface Patient {
  patientId: number;
  ime: string;
  prezime: string;
  jmbg: string;
  datumRodjenja: string;
  pol: string;
  telefon: string;
  email: string | null;
  aktivan: boolean;
  jeStudent: boolean;
  jePenzioner: boolean;
}

export interface PatientDetail extends Patient {
  adresa: string | null;
  brojOsiguranja: string | null;
  napomene: string | null;
  datumRegistracije: string;
  allergies: Allergy[];
}

export interface Allergy {
  allergyId: number;
  nazivAlergena: string;
  opis: string | null;
  ozbiljnost: string;
}

export interface PatientHistory {
  appointments: AppointmentSummary[];
  examinations: ExaminationSummary[];
}

export interface AppointmentSummary {
  appointmentId: number;
  datumVreme: string;
  uslugaNaziv: string;
  lekarIme: string;
  status: string;
}

export interface ExaminationSummary {
  examinationId: number;
  datumPregleda: string;
  dijagnozaTekst: string | null;
  lekarIme: string;
  status: string;
}
