export interface Office {
  officeId: number;
  naziv: string;
  lokacija: string | null;
  oprema: string | null;
  dostupna: boolean;
}

export interface CreateOfficeRequest {
  naziv: string;
  lokacija: string | null;
  oprema: string | null;
  dostupna: boolean;
}

export interface UpdateOfficeRequest {
  naziv: string;
  lokacija: string | null;
  oprema: string | null;
  dostupna: boolean;
}
