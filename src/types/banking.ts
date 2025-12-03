export interface Institution {
  id: string;
  name: string;
  fullName?: string;
  countries?: Array<{
    countryCode2?: string;
    displayName?: string;
  }>;
  country?: string;
  media?: Array<{
    type: string;
    source: string;
  }>;
  features?: string[];
}

export interface Account {
  id: string;
  type: string;
  accountType: string;
  currency: string;
  institutionId: string;
  institutionName: string;
  consentToken?: string;
  _consentToken?: string;
  _institutionId?: string;
  accountNames?: Array<{ name: string }>;
  accountIdentifications?: Array<{
    type: string;
    identification: string;
  }>;
}

export interface Balance {
  type: string;
  balanceAmount: {
    amount: number;
    currency: string;
  };
}

export interface Transaction {
  id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transactionAmount: {
    amount: number;
    currency: string;
  };
  status: string;
  accountId?: string;
  _accountId?: string;
  _accountType?: string;
  _currency?: string;
  enrichment?: {
    categorisation?: {
      categories?: string[];
    };
  };
}

export interface ConsentToken {
  token: string;
  institutionId: string;
  addedAt: string;
  reconfirmBy?: string;
}

export interface AuthRequest {
  id: string;
  status: string;
  institutionId: string;
  consentToken?: string;
  authorisationUrl?: string;
  createdAt: string;
  reconfirmBy?: string;
}
