import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

interface ParsedFilters {
  city: string | null;
  priceMax: number | null;
  keywords: string;
}

export const aiHyperSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(500) }).parse(input))
  .handler(async ({ data }): Promise<ParsedFilters> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { city: null, priceMax: null, keywords: data.query };
    }
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Wyodrębniasz kryteria wyszukiwania nieruchomości w Polsce z naturalnego zapytania.
Zwracasz TYLKO valid JSON: {"city": string|null, "priceMax": number|null, "keywords": string}.
- city: miasto (np. "Gdańsk", "Warszawa") lub null jeśli nie podano
- priceMax: maksymalna cena w PLN jako liczba (np. "600 tys" => 600000, "1 mln" => 1000000) lub null
- keywords: kluczowe cechy oddzielone spacjami (np. "balkon park szkoła"), do wyszukiwania frazowego`,
          },
          { role: "user", content: data.query },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (resp.status === 429) throw new Error("Zbyt wiele zapytań AI. Spróbuj za chwilę.");
    if (resp.status === 402) throw new Error("Wyczerpano kredyty AI. Doładuj w Settings → Workspace → Usage.");
    if (!resp.ok) throw new Error("AI niedostępne");
    const json = await resp.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        city: typeof parsed.city === "string" ? parsed.city : null,
        priceMax: typeof parsed.priceMax === "number" ? parsed.priceMax : null,
        keywords: typeof parsed.keywords === "string" ? parsed.keywords : data.query,
      };
    } catch {
      return { city: null, priceMax: null, keywords: data.query };
    }
  });
