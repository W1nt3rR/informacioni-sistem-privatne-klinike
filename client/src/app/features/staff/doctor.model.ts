export interface Doctor {
  doctorId: number;
  userId: string;
  ime: string;
  prezime: string;
  email: string;
  telefon: string | null;
  titula: string | null;
  licencaBroj: string;
  aktivan: boolean;
  specializationId: number;
  specijalizacijaNaziv: string;
}

export interface DoctorDetail extends Doctor {
  services: DoctorServiceItem[];
  workingHours: WorkingHoursItem[];
}

export interface DoctorServiceItem {
  serviceId: number;
  naziv: string;
  trajanjeMinuta: number;
  cena: number;
}

export interface WorkingHoursItem {
  workingHoursId: number;
  danUNedelji: number;
  vremeOd: string;
  vremeDo: string;
}

export interface CreateDoctorRequest {
  ime: string;
  prezime: string;
  email: string;
  telefon: string | null;
  userName: string;
  password: string;
  specializationId: number;
  titula: string | null;
  licencaBroj: string;
}

export interface UpdateDoctorRequest {
  ime: string;
  prezime: string;
  email: string;
  telefon: string | null;
  specializationId: number;
  titula: string | null;
  licencaBroj: string;
}
