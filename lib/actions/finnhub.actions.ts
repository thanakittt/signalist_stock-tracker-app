"use server";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

interface FetchOptions {
  cache?: "force-cache" | "no-store";
  next?: {
    revalidate?: number;
  };
}

interface NewsArticle {
  id?: number;
  category?: string;
  datetime: number;
  headline: string;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url: string;
}

interface FormattedArticle {
  id?: number;
  datetime: number;
  headline: string;
  image?: string;
  source?: string;
  summary?: string;
  url: string;
  symbol?: string;
}

const fetchJSON = async <T>(
  url: string,
  revalidateSeconds?: number
): Promise<T> => {
  const options: FetchOptions = {};

  if (revalidateSeconds !== undefined) {
    options.cache = "force-cache";
    options.next = { revalidate: revalidateSeconds };
  } else {
    options.cache = "no-store";
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const isValidArticle = (article: NewsArticle): boolean => {
  return !!(
    article &&
    article.datetime &&
    article.headline &&
    article.url &&
    article.headline.trim() !== "" &&
    article.url.trim() !== ""
  );
};

const formatArticle = (
  article: NewsArticle,
  symbol?: string
): FormattedArticle => {
  return {
    id: article.id,
    datetime: article.datetime,
    headline: article.headline,
    image: article.image,
    source: article.source,
    summary: article.summary,
    url: article.url,
    symbol,
  };
};

export const getNews = async (
  symbols?: string[]
): Promise<FormattedArticle[]> => {
  try {
    if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
      throw new Error("Finnhub API key is not configured");
    }

    const now = new Date();
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(now.getDate() - 5);

    const toDate = now.toISOString().split("T")[0];
    const fromDate = fiveDaysAgo.toISOString().split("T")[0];

    // If symbols provided, fetch company-specific news
    if (symbols && symbols.length > 0) {
      const cleanSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);

      if (cleanSymbols.length === 0) {
        return [];
      }

  const articles: FormattedArticle[] = [];
  const maxRounds = 6;
      let round = 0;

  // Round-robin through symbols to collect one article per round
  while (articles.length < 6 && round < maxRounds) {
    for (const symbol of cleanSymbols) {
      if (articles.length >= 6) break;

      try {
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
        const news = await fetchJSON<NewsArticle[]>(url);

        // Skip articles we already collected by checking the round index
        if (news && news.length > round) {
          const article = news[round];
          if (isValidArticle(article)) {
            articles.push(formatArticle(article, symbol));
          }
        }
      } catch (error) {
            console.error(`Error fetching news for symbol ${symbol}:`, error);
      }
    }
    round++;
  }

  // Sort by datetime descending
  articles.sort((a, b) => b.datetime - a.datetime);

  return articles;
    }

    // No symbols provided, fetch general market news
    const url = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const news = await fetchJSON<NewsArticle[]>(url);

    if (!news || news.length === 0) {
      return [];
    }

    // Deduplicate by id, url, and headline
    const seen = new Set<string>();
    const uniqueArticles: NewsArticle[] = [];

    for (const article of news) {
      if (!isValidArticle(article)) continue;

      const key = `${article.id || ""}-${article.url}-${article.headline}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueArticles.push(article);
      }
    }

    // Take top 6 and format
    const topArticles = uniqueArticles.slice(0, 6);
    return topArticles.map((article) => formatArticle(article));
  } catch (error) {
    console.error("Error in getNews:", error);
    throw new Error("Failed to fetch news");
  }
};
