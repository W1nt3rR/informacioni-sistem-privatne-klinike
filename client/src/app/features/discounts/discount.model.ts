export interface Discount {
  discountId: number;
  naziv: string;
  tip: string;
  procenat: number;
  vaziOd: string | null;
  vaziDo: string | null;
  aktivan: boolean;
  jeSistemski: boolean;
  kod: string | null;
}

export interface CreateDiscountRequest {
  naziv: string;
  procenat: number;
  vaziOd: string | null;
  vaziDo: string | null;
  aktivan: boolean;
  kod: string;
}

export interface UpdateDiscountRequest {
  naziv: string;
  procenat: number;
  vaziOd: string | null;
  vaziDo: string | null;
  aktivan: boolean;
}

export interface ValidateCodeResponse {
  valid: boolean;
  discountId?: number;
  naziv?: string;
  procenat?: number;
}
