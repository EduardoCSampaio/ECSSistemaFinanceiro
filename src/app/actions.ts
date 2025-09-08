'use server';

import { categorizeTransaction as categorizeTransactionFlow, CategorizeTransactionInput } from '@/ai/flows/categorize-transaction';
import { transactions } from '@/lib/data';

export async function getCategorySuggestion(description: string): Promise<{ suggestedCategory: string; confidenceScore: number; }> {
  if (!description || description.trim().length < 5) {
    return { suggestedCategory: '', confidenceScore: 0 };
  }

  const transactionHistory = transactions
    .slice(0, 15) // Use a slice of recent history for context
    .map(t => `Description: ${t.description}, Category: ${t.category.name}`)
    .join('\n');

  const input: CategorizeTransactionInput = {
    transactionDescription: description,
    transactionHistory: transactionHistory,
  };

  try {
    const result = await categorizeTransactionFlow(input);
    return result;
  } catch (error) {
    console.error('AI categorization failed:', error);
    // Return a default empty state on failure
    return { suggestedCategory: '', confidenceScore: 0 };
  }
}
