export type Party = {
  id: string;
  partyCode: string;
  partyName: string;
  contactNo: string;
  email: string;
  address: string;
  gstTin: string;
  partyType: string;
  panNo: string;
  opBalance: number;
  accountStartFrom: string;
};

export type Booking = {
  id: string;
  bookingFrom: string;
  lrNo: string;
  lrDate: string;
  from: string;
  to: string;
  vehicleNo: string;
  deliveryAt: string;
  /** lrdetails.expdel — days or a date string */
  expectedDelivery?: string;
  /** lrdetails.paymode — NA / Credit */
  payMode?: string;
  billingParty: string;
  consignor: string;
  consignee: string;
  /** PDF email destination typed on the booking form */
  receiverEmail?: string;
  address: string;
  gstNo: string;
  noOfArticles: string;
  particulars: string;
  invNoDate: string;
  actualWt: number;
  chargedWt: number;
  rate: number;
  freight: number;
  hamali: number;
  stCharges: number;
  lrCharges: number;
  doorDelivery: number;
  doorColle: number;
  barrier: number;
  otherChrg: number;
  total: number;
  grandTotal: number;
  /** e.g. "GST @ 0%" — typed or picked */
  gstLabel?: string;
  gstAmt?: number;
  gstPaidBy: string;
  ewayBillNo: string;
  validDate: string;
  lrType: string;
  valueRs: number;
  /** true when goods delivered to consignee */
  delivered?: boolean;
};

export type Challan = {
  id: string;
  challanNo: string;
  challanDate: string;
  vehicleNo: string;
  brokerOwner: string;
  brokerPan: string;
  fromStation: string;
  toStation: string;
  freight: number;
  advance: number;
  transfer: number;
  cash: number;
  fuel: number;
  balance: number;
  driverName: string;
  licenceNo: string;
  engine: string;
  chessy: string;
  insuNo: string;
  owner: string;
  panNo: string;
  lrIds: string[];
};

export type LhpPayment = {
  id: string;
  transactionDate: string;
  challanNo: string;
  date: string;
  broker: string;
  vehNo: string;
  outstanding: number;
  paidAmt: number;
  deduction: number;
  balance: number;
  narration: string;
};

export type Bill = {
  id: string;
  billNo: string;
  billDate: string;
  partyName: string;
  /** PDF email destination typed on the bill form */
  receiverEmail?: string;
  /** LR freight sum — old billmaster.bamt */
  totalAmount: number;
  lrCharges?: number;
  detention?: number;
  hamali?: number;
  doorDelivery?: number;
  doorCollection?: number;
  other?: number;
  remark: string;
  submissionDate: string;
  lrIds: string[];
};

export type MoneyReceipt = {
  id: string;
  transactionDate: string;
  billNo: string;
  date: string;
  partyName: string;
  outstanding: number;
  mrNo: string;
  paidAmt: number;
  deduction: number;
  balance: number;
  narration: string;
};

export type NoteVoucher = {
  id: string;
  type: "debit" | "credit" | "expense";
  date: string;
  partyName: string;
  amount: number;
  narration: string;
  voucherNo: string;
};

export type Masters = {
  stations: string[];
  vehicles: string[];
  brokers: string[];
  particulars: string[];
  partyTypes: string[];
  gstPaidBy: string[];
  lrTypes: string[];
  gstLabels?: string[];
};
