// src/ai/flows/categorize-transaction.ts
'use server';

/**
 * @fileOverview A transaction categorization AI agent.
 *
 * - categorizeTransaction - A function that handles the transaction categorization process.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  transactionDescription: z
    .string()
    .describe('The description of the transaction.'),
  transactionHistory: z
    .string()
    .describe(
      'The past transaction history of the user, as a string. Should include the description and category of each transaction.'
    ),
});
export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  suggestedCategory: z.string().describe('The suggested category for the transaction.'),
  confidenceScore: z.number().describe('A score indicating the confidence level of the suggestion (0-1).'),
});
export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(input: CategorizeTransactionInput): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `You are an expert financial assistant specializing in categorizing transactions.

You will use the transaction description and the user's past transaction history to suggest the most appropriate category for the transaction.

Transaction Description: {{{transactionDescription}}}

Transaction History: {{{transactionHistory}}}

Based on the description and history, what is the most likely category for this transaction? Also, provide a confidence score between 0 and 1.

Respond with a JSON object that contains the suggested category and a confidence score.
`,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
