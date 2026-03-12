'use server';
/**
 * @fileOverview A market intelligence AI agent specialized for Karnataka agricultural prices.
 *
 * - getMarketIntelligence - A function that estimates current crop market prices in Karnataka.
 * - MarketIntelligenceInput - The input type for the function.
 * - MarketIntelligenceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MarketIntelligenceInputSchema = z.object({
  cropName: z.string().describe('The name of the crop, fruit, or vegetable (e.g., Byadgi Chilli, Alphonso Mango, Mysore Silk, Onion).'),
});
export type MarketIntelligenceInput = z.infer<typeof MarketIntelligenceInputSchema>;

const MarketIntelligenceOutputSchema = z.object({
  cropName: z.string(),
  location: z.string().describe('The specific Mandi or region in Karnataka (e.g., Yeshwanthpur, Hubli, Kolar).'),
  estimatedPriceRange: z.object({
    min: z.number().describe('Minimum price per Kg/Quintal in INR'),
    max: z.number().describe('Maximum price per Kg/Quintal in INR'),
    average: z.number().describe('Average price per Kg/Quintal in INR'),
    unit: z.string().describe('The unit of measurement (e.g., Kg, Quintal, Box).'),
  }),
  trend: z.enum(['Rising', 'Stable', 'Falling']).describe('The current market trend in Karnataka.'),
  insight: z.string().describe('A brief explanation of why the price is at this level in Karnataka (seasonal factors, rainfall in Western Ghats, etc.).'),
  lastUpdated: z.string().describe('Relative time string like "Today" or "Yesterday".'),
});
export type MarketIntelligenceOutput = z.infer<typeof MarketIntelligenceOutputSchema>;

export async function getMarketIntelligence(input: MarketIntelligenceInput): Promise<MarketIntelligenceOutput> {
  return marketIntelligenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketIntelligencePrompt',
  input: { schema: MarketIntelligenceInputSchema },
  output: { schema: MarketIntelligenceOutputSchema },
  prompt: `You are an expert agricultural market analyst specializing EXCLUSIVELY in the Karnataka market (APMC/Mandi rates). 
  Provide a realistic estimation of the current market price for the specified produce, which could be a vegetable, fruit, or commercial crop.
  
  Focus on major Karnataka hubs like Yeshwanthpur, Kolar (for tomatoes), Hubli, Davanagere, or Mysore.
  
  Use current seasonal knowledge for Karnataka (assuming current date is March 2026).
  
  Produce: {{{cropName}}}
  Region: Karnataka, India
  
  Provide the output in the specified JSON format. Ensure prices are accurate to current Karnataka market conditions.`,
});

const marketIntelligenceFlow = ai.defineFlow(
  {
    name: 'marketIntelligenceFlow',
    inputSchema: MarketIntelligenceInputSchema,
    outputSchema: MarketIntelligenceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate market intelligence');
    return output;
  }
);
