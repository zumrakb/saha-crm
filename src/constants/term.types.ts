import type { TermStatus } from '../constants/termStatus';

export interface Term {
  id: number;
  customerId: number;
  productName: string;
  orderDate: string;
  termDuration: string;
  expectedDate: string;
  status: TermStatus;
  arrivedAt: string | null;
  createdAt: string;

  // --- YENI EKLENEN FINANSAL VE SATIS ASAMASI ALANLARI ---
  price: number;
  currency: string;
  stage: 'firsat' | 'teklif_verildi' | 'kazanildi' | 'kaybedildi';
}

// Freemium (Ücretsiz kullanım limiti) takibi için yeni tipimiz
export interface FeatureUsage {
  feature_key: string;
  usage_count: number;
  period_start: string;
  is_premium: number;
}
