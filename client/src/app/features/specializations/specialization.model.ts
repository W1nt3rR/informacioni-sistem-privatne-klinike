export interface Specialization {
  specializationId: number;
  naziv: string;
  opis: string | null;
}

export interface CreateSpecializationRequest {
  naziv: string;
  opis: string | null;
}

export interface UpdateSpecializationRequest {
  naziv: string;
  opis: string | null;
}
