export interface NonWorkingDay {
  nonWorkingDayId: number;
  datum: string;
  naziv: string;
  opis: string | null;
}

export interface CreateNonWorkingDayRequest {
  datum: string;
  naziv: string;
  opis: string | null;
}

export interface UpdateNonWorkingDayRequest {
  datum: string;
  naziv: string;
  opis: string | null;
}
