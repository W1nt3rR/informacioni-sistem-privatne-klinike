export interface Diagnosis {
  diagnosisId: number;
  sifra: string;
  naziv: string;
  opis: string | null;
}

export interface CreateDiagnosisRequest {
  sifra: string;
  naziv: string;
  opis: string | null;
}

export interface UpdateDiagnosisRequest {
  sifra: string;
  naziv: string;
  opis: string | null;
}
