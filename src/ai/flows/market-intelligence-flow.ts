'use server';
/**
 * @fileOverview A market intelligence AI agent specialized for Karnataka agricultural prices across multiple Mandis.
 *
 * - getMarketIntelligence - A function that estimates current crop market prices in multiple Karnataka locations.
 * - MarketIntelligenceInput - The input type for the function.
 * - MarketIntelligenceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Increase timeout for server action to handle slower mobile networks
export const maxDuration = 60;

const MarketIntelligenceInputSchema = z.object({
  cropName: z.string().describe('The name of the crop, fruit, or vegetable (e.g., Byadgi Chilli, Alphonso Mango, Onion).'),
});
export type MarketIntelligenceInput = z.infer<typeof MarketIntelligenceInputSchema>;

const MarketIntelligenceOutputSchema = z.object({
  cropName: z.string(),
  overallTrend: z.enum(['Rising', 'Stable', 'Falling']).describe('The overall market trend across Karnataka.'),
  insight: z.string().describe('A summary explanation of the current market state in Karnataka.'),
  lastUpdated: z.string().describe('Relative time string like "Today" or "Yesterday".'),
  marketRates: z.array(z.object({
    location: z.string().describe('The specific Mandi name in Karnataka (e.g., Yeshwanthpur, Hubli, Kolar, Mysore, Davanagere, Bagalkot, Belgaum).'),
    min: z.number().describe('Minimum price in INR'),
    max: z.number().describe('Maximum price in INR'),
    average: z.number().describe('Average price in INR'),
    unit: z.string().describe('The unit of measurement (usually Kg or Quintal).'),
  })).describe('Estimated rates for the produce in 5-8 major Karnataka Mandis.'),
});
export type MarketIntelligenceOutput = z.infer<typeof MarketIntelligenceOutputSchema>;

export async function getMarketIntelligence(input: MarketIntelligenceInput): Promise<MarketIntelligenceOutput> {
  try {
    return await marketIntelligenceFlow(input);
  } catch (error) {
    console.error('Market Intelligence Error:', error);
    throw error;
  }
}

const prompt = ai.definePrompt({
  name: 'marketIntelligencePrompt',
  input: { schema: MarketIntelligenceInputSchema },
  output: { schema: MarketIntelligenceOutputSchema },
  config: {
    // Relax safety settings to avoid false positives with agricultural terms
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
  prompt: `You are an expert agricultural market analyst specializing EXCLUSIVELY in the Karnataka market (APMC/Mandi rates). 
  Provide a realistic estimation of the current market price for the specified produce across MULTIPLE major locations in Karnataka.
  
  For the given produce, identify 5 to 8 key Mandis in Karnataka where it is majorly traded (e.g., Kolar for Tomatoes, Yeshwanthpur for Onions/Potatoes, Hubli for Grains, Byadgi for Chillies, Mysore for Fruits).
  
  Use current seasonal knowledge for Karnataka (assuming current date is March 2026).
  
  Produce: {{{cropName}}}
  Region: Karnataka, India
  
  Ensure prices are realistic for Karnataka's APMC standards. Rates should generally be per Kg for vegetables/fruits and per Quintal for grains where standard, but specify clearly. Provide the output in the specified JSON format.`,
});

const marketIntelligenceFlow = ai.defineFlow(
  {
    name: 'marketIntelligenceFlow',
    inputSchema: MarketIntelligenceInputSchema,
    outputSchema: MarketIntelligenceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model was unable to generate a response. This might be due to safety filters or a temporary service issue.');
    }
    return output;
  }
);
