export interface ExaminationListItem {
  examinationId: number;
  appointmentId: number;
  patientIme: string;
  patientPrezime: string;
  doctorIme: string;
  doctorPrezime: string;
  dijagnozaSifra?: string;
  dijagnozaNaziv?: string;
  datumPregleda: string;
  status: string;
}

export interface ExaminationDetail {
  examinationId: number;
  appointmentId: number;
  patientId: number;
  patientIme: string;
  patientPrezime: string;
  doctorId: number;
  doctorIme: string;
  doctorPrezime: string;
  anamneza?: string;
  simptomi?: string;
  diagnosisId?: number;
  dijagnozaSifra?: string;
  dijagnozaTekst?: string;
  zakljucak?: string;
  preporuka?: string;
  datumPregleda: string;
  status: string;
  therapies: Therapy[];
  referrals: Referral[];
  medicalReport?: MedicalReport;
}

export interface Therapy {
  therapyId: number;
  examinationId: number;
  nazivLeka: string;
  doza: string;
  ucestalost: string;
  trajanje: string;
  napomena?: string;
}

export interface Referral {
  referralId: number;
  examinationId: number;
  tip: string;
  opis: string;
  status: string;
}

export interface MedicalReport {
  medicalReportId: number;
  examinationId: number;
  sadrzaj: string;
  datumKreiranja: string;
  status: string;
}

export interface CreateExaminationRequest {
  appointmentId: number;
}

export interface UpdateExaminationRequest {
  anamneza?: string;
  simptomi?: string;
  diagnosisId?: number;
  dijagnozaTekst?: string;
  zakljucak?: string;
  preporuka?: string;
}

export interface CreateTherapyRequest {
  nazivLeka: string;
  doza: string;
  ucestalost: string;
  trajanje: string;
  napomena?: string;
}

export interface CreateReferralRequest {
  tip: string;
  opis: string;
}

export interface Diagnosis {
  diagnosisId: number;
  sifra: string;
  naziv: string;
  opis?: string;
}
