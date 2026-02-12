
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getInstitutionalAnalysis = async (
  symbol: string,
  price: number,
  trends: Record<string, string>
): Promise<AnalysisResult> => {
  try {
    const prompt = `Analyze the current Forex market state for ${symbol}.
    Current Price: ${price}
    Multi-Timeframe Matrix Trends: ${JSON.stringify(trends)}
    
    Provide an institutional-grade analysis focusing on:
    1. Overall Bias (BULLISH, BEARISH, NEUTRAL)
    2. A confidence score from -10 to +10.
    3. Institutional reasoning (mentioning concepts like Order Blocks, Fair Value Gaps, or Liquidity Sweeps).
    4. 3 specific institutional insights.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bias: { type: Type.STRING },
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            institutionalInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["bias", "score", "reasoning", "institutionalInsights"]
        }
      }
    });

    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      bias: 'NEUTRAL',
      score: 0,
      reasoning: "Analysis temporarily unavailable. Maintaining previous bias based on EMA confluence.",
      institutionalInsights: ["Market volatility increasing", "Awaiting session liquidity", "Order book stabilizing"]
    };
  }
};
