export interface InvoiceListItem {
  invoiceId: number;
  brojRacuna: string;
  datumIzdavanja: string;
  ukupanIznos: number;
  popustProcenat: number;
  iznosZaNaplatu: number;
  statusNaplate: string;
  napomena?: string;
  patientId: number;
  patientIme: string;
  patientPrezime: string;
}

export interface InvoiceDetail extends InvoiceListItem {
  items: InvoiceItem[];
  payments: PaymentItem[];
  appliedDiscounts: InvoiceDiscountItem[];
}

export interface InvoiceItem {
  invoiceItemId: number;
  serviceId: number;
  serviceNaziv: string;
  examinationId?: number;
  jedinicnaCena: number;
  kolicina: number;
  popustProcenat: number;
  iznos: number;
}

export interface InvoiceDiscountItem {
  naziv: string;
  tip: string;
  procenat: number;
}

export interface PaymentItem {
  paymentId: number;
  iznos: number;
  nacinPlacanja: string;
  datumPlacanja: string;
  napomena?: string;
}

export interface CreateInvoiceRequest {
  patientId: number;
  napomena?: string;
  items: CreateInvoiceItemRequest[];
  kodPopusta?: string;
}

export interface CreateInvoiceItemRequest {
  serviceId: number;
  examinationId?: number;
  kolicina: number;
}

export interface InvoicePreviewRequest {
  patientId: number;
  items: CreateInvoiceItemRequest[];
  kodPopusta?: string;
}

export interface InvoicePreviewResponse {
  ukupanIznos: number;
  popustProcenat: number;
  iznosZaNaplatu: number;
  appliedDiscounts: InvoiceDiscountItem[];
}

export interface CreatePaymentRequest {
  iznos: number;
  nacinPlacanja: string;
  napomena?: string;
}

export interface DailyRevenue {
  date: string;
  totalRevenue: number;
  invoiceCount: number;
  paymentCount: number;
  invoices: InvoiceListItem[];
}

export interface ServiceOption {
  serviceId: number;
  naziv: string;
  cena: number;
}

export interface PatientOption {
  patientId: number;
  ime: string;
  prezime: string;
  jmbg: string;
}
