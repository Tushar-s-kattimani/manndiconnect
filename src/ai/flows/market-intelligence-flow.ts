'use server';
/**
 * @fileOverview A market intelligence AI agent for agricultural prices.
 *
 * - getMarketIntelligence - A function that estimates current crop market prices.
 * - MarketIntelligenceInput - The input type for the function.
 * - MarketIntelligenceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MarketIntelligenceInputSchema = z.object({
  cropName: z.string().describe('The name of the crop to check (e.g., Wheat, Basmati Rice, Tomato).'),
  location: z.string().optional().describe('The location to check prices for (e.g., Punjab, Maharashtra).'),
});
export type MarketIntelligenceInput = z.infer<typeof MarketIntelligenceInputSchema>;

const MarketIntelligenceOutputSchema = z.object({
  cropName: z.string(),
  estimatedPriceRange: z.object({
    min: z.number().describe('Minimum price per Kg in INR'),
    max: z.number().describe('Maximum price per Kg in INR'),
    average: z.number().describe('Average price per Kg in INR'),
  }),
  trend: z.enum(['Rising', 'Stable', 'Falling']).describe('The current market trend.'),
  insight: z.string().describe('A brief explanation of why the price is at this level (e.g., seasonal changes, harvest reports).'),
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
  prompt: `You are an expert agricultural market analyst in India. 
  Provide a realistic estimation of the current market price (Mandi rate) for the specified crop. 
  Use current seasonal knowledge (assuming current date is March 2026 as per app context).
  
  Crop: {{{cropName}}}
  Location: {{#if location}}{{{location}}}{{else}}General India{{/if}}
  
  Provide the output in the specified JSON format. Ensure prices are in INR per Kilogram.`,
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
