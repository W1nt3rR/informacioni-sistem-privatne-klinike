export interface Discount {
  discountId: number;
  naziv: string;
  tip: string;
  procenat: number;
  vaziOd: string | null;
  vaziDo: string | null;
  aktivan: boolean;
}

export interface CreateDiscountRequest {
  naziv: string;
  tip: string;
  procenat: number;
  vaziOd: string | null;
  vaziDo: string | null;
  aktivan: boolean;
}

export interface UpdateDiscountRequest {
  naziv: string;
  tip: string;
  procenat: number;
  vaziOd: string | null;
  vaziDo: string | null;
  aktivan: boolean;
}
